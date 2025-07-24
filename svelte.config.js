import adapter from '@sveltejs/adapter-node';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  kit: {
    adapter: adapter({
      out: 'build' // This will generate a Node.js app in /build
    })
  }
};

export default config;
