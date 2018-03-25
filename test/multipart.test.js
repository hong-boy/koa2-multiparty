'use strict';
const Buffer = require('safe-buffer').Buffer;
const multipart = require('../index');
const request = require('supertest');
const assert = require('power-assert');
const Koa = require('koa');

function createServer (opts) {
    const app = new Koa();
    const router = require('koa-router')();
    router.use(multipart(opts));

    router.use('/body', function (ctx, next) {
        ctx.set('Content-Type', 'application/json; charset=utf-8');
        ctx.status = 200;
        ctx.body = req.body;
        return next();
    });

    router.use('/files', function (ctx, next) {
        ctx.set('Content-Type', 'application/json; charset=utf-8');
        ctx.body = req.files;
        return next();
    });

    app.use(router.routes(), router.allowedMethods());

    return app.callback();
}


describe('multipart()', function () {
    it('should ignore GET', function(done){
        request(createServer())
            .get('/body')
            .field('user', 'Tobi')
            .expect(200)
            .end(function (err, res) {
                done();
            });
    });
    describe('with multipart/form-data', function () {
        it('should populate req.body', function(done){
            request(createServer())
                .post('/body')
                .field('user', 'Tobi')
                .expect(200, { user: 'Tobi' })
                .end(function (err, res) {
                    done();
                });
        });

        it('should handle duplicated middleware', function (done) {
            var app = new Koa();
            var router = require('koa-router')()
                .use(multipart())
                .use(multipart())
                .use(function (req, res) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify(req.body))
                });

            app.use(router.routes(), router.allowedMethods());

            request(app.callback())
                .post('/body')
                .field('user', 'Tobi')
                .expect(200, { user: 'Tobi' })
                .end(function (err, res) {
                    done();
                });
        });

        it('should support files', function(done){
            var app = new Koa();
            var router = require('koa-router')()
                .post('/upload', function(ctx, next){
                    let req = ctx.req;
                    assert(req.body.user, {name: 'Tobi'});
                    assert(req.files);
                    ctx.body = req.files.text.originalFilename;
                });

            app.use(router.routes(), router.allowedMethods());

            request(app.callback())
                .post('/upload')
                .field('user[name]', 'Tobi')
                .attach('text', Buffer.from('some text here'), 'foo.txt')
                .expect(200, 'foo.txt')
                .end(function (err, res) {
                    done();
                });
        })
    })
});
