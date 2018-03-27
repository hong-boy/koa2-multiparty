'use strict';

const multiparty = require('multiparty');
const onFinished = require('on-finished');
const qs = require('qs');
const typeis = require('type-is');

/**
 * Module exports.
 * @public
 */

module.exports = multipart;

/**
 * The same as [connect-multipart]
 *
 * Parse multipart/form-data request bodies, providing the parsed
 * object as `req.body` and `req.files`.
 * The options passed are merged with [multiparty](https://github.com/pillarjs/multiparty)'s
 * @param {Object} options
 * @return {Function}
 * @public
 */

function multipart(options={}){
    return async function(ctx, next){
        let req = ctx.req;
        if(req._body){
            // already parsed
            await next();
            return;
        }
        req.body = req.body || {};
        req.files = req.files || {};

        // ignore GET
        if ('GET' === req.method || 'HEAD' === req.method) {
            await next();
            return;
        }

        // check Content-Type
        if (!typeis(req, 'multipart/form-data')) {
            await next();
            return;
        }

        function _parse(req){
            return new Promise(function (resolve, reject) {
                // flag as parsed
                req._body = true;

                // parse
                var form = new multiparty.Form(options);
                var data = {};
                var files = {};
                var done = false;

                function ondata(name, val, data){
                    if (Array.isArray(data[name])) {
                        data[name].push(val);
                    } else if (data[name]) {
                        data[name] = [data[name], val];
                    } else {
                        data[name] = val;
                    }
                }

                form.on('field', function(name, val){
                    ondata(name, val, data);
                });

                form.on('file', function(name, val){
                    val.name = val.originalFilename;
                    val.type = val.headers['content-type'] || null;
                    ondata(name, val, files);
                });

                form.on('error', function(err){
                    if (done) return;

                    done = true;
                    err.status = 400;

                    if (!req.readable) {
                        reject(err);
                        return;
                    }
                    req.resume();
                    onFinished(req, ()=>reject(err));
                });

                form.on('close', function() {
                    if (done) return;

                    done = true;

                    try {
                        req.body = qs.parse(data, { allowDots: true });
                        req.files = qs.parse(files, { allowDots: true });
                        resolve();
                    } catch (err) {
                        err.status = 400;
                        reject(err)
                    }
                });

                form.parse(req);
            });
        }

        try {
            await _parse(req);
            await next();
        } catch (e) {
            ctx.status = e.status||500;
            ctx.body = e;
        }
    };
}
