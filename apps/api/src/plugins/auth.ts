import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticate } from '../hooks/authenticate.js';

type UserInfo = {
  id: string;
  email: string;
  role: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    user: UserInfo;
  }

  interface FastifyInstance {
    authenticate: typeof authenticate;
  }
}

const userStore = new WeakMap<object, UserInfo>();

export default fp(async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('user', {
    getter(this: FastifyRequest) {
      return userStore.get(this) ?? { id: '', email: '', role: '' };
    },
    setter(this: FastifyRequest, v: UserInfo) {
      userStore.set(this, v);
    },
  });
  fastify.decorate('authenticate', authenticate);
});
