'use strict';

/*
  PRECOMPILE DUST WITH
  dustc --cjs --split --watch ./**\/*.dust
*/

const { join } = require('path')
const server = require('./lib/server');
const Koa = require('koa');
const Router = require('koa-router');
const serve = require('koa-static');
const mount = require('koa-mount');

const staticPath = join(process.cwd(), '/statics');
const serveMount = mount('/statics', serve(staticPath, { maxage: 0, gzip: true, defer: true }));

const argv = require('minimist')(process.argv.slice(2));

const app = new Koa();
const router = new Router();

app.use(async ( ctx, next ) => {
  await next();
  if (ctx.response.status === 404) {
    console.log('request to :', '404');
    if (!!argv.dev) await server.devSRV.call(ctx, 'fourofour');
    else await server.prodSRV.call(ctx, 'fourofour');
  }
});

app.use(async (ctx, next) => {
  ctx.statusCode = 200;
  await serveMount(ctx, next)
});

router.get('/', async ( ctx, next ) => {
  await next();
  if (!!argv.dev) await server.devSRV.call(ctx, 'home');
  else await server.prodSRV.call(ctx, 'home');
});

app.use(router.routes());

app.on('error', function(err) {
  // console.error('server error', err);
});

app.listen(1337);
console.log('SERVER RUNNING');
