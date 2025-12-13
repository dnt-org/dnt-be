'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/logs',
    handler: 'logs.find',
    config: { policies: [] },
  },
  {
    method: 'GET',
    path: '/logs/:id',
    handler: 'logs.findOne',
    config: { policies: [] },
  },
  {
    method: 'POST',
    path: '/logs',
    handler: 'logs.create',
    config: { policies: [] },
  },
  {
    method: 'DELETE',
    path: '/logs/:id',
    handler: 'logs.delete',
    config: { policies: [] },
  },
  {
    method: 'DELETE',
    path: '/logs',
    handler: 'logs.clear',
    config: { policies: [] },
  },
];