// https://umijs.org/config/
import os from 'os'

import { defineConfig } from 'umi'
import pageRoutes from './router.config'
import webpackPlugin from './plugin.config'
import defaultSettings from '../src/defaultSettings'
// import { primaryColor } from '../src/assets/jss/index'

const plugins = {
  antd: {},
  dva: {
    hmr: true,
    skipModelValidate: true,
  },
  // layout: {
  //   // https://umijs.org/zh-CN/plugins/plugin-layout
  //   locale: true,
  //   siderWidth: 208,
  //   ...defaultSettings,
  // },
  // https://umijs.org/zh-CN/plugins/plugin-locale
  locale: {
    // default zh-CN
    default: 'en-US',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: false,
  },
  dynamicImport: {
    loading: '@/components/PageLoading/index',
  },
  sass: {
    // 默认值 Dart Sass，如果要改用 Node Sass，可安装 node-sass 依赖，然后使用该配置项
    implementation: require('node-sass'),
    // 传递给 Dart Sass 或 Node Sass 的配置项，可以是一个 Function
    sassOptions: {},
  },
  // pwa: {},
  // pwa: {
  //   workboxPluginMode: 'InjectManifest',
  //   workboxOptions: {
  //     importWorkboxFrom: 'local',
  //   },
  // },
  ...(!process.env.TEST && os.platform() === 'darwin'
    ? {
        dll: {
          include: ['dva', 'dva/router', 'dva/saga', 'dva/fetch'],
          exclude: ['@babel/runtime'],
        },
        hardSource: true,
      }
    : {}),
}

export default defineConfig({
  // add for transfer to umi
  ...plugins,
  targets: {
    ie: 11,
  },
  title: false,
  hash: true,
  define: {
    APP_TYPE: process.env.APP_TYPE || '',
    'process.env.client_env': '{environment}',
    'process.env.client_secret': '{client_secret}',
    'process.env.url': '{url}',
    'process.env.signalrUrl': '{signalr_url}',
    'process.env.default_cliniccode': '{default_cliniccode}',
  },
  // 路由配置
  routes: pageRoutes,
  // Theme for antd
  // https://ant.design/docs/react/customize-theme-cn
  theme: {
    'primary-color': defaultSettings.primaryColor,
    'font-family': 'Roboto, Helvetica, Arial, sans-serif',
    'text-color': 'inherit',
    'border-radius-base': '3px',
    'border-radius-sm': '2px',
    'component-background': 'white',
    // 'font-size-base': '1rem',
    // 'font-size-lg': '1.2rem',
    // 'font-size-sm': '0.9rem',
    'zindex-popoconfirm': '2000',
    'zindex-notification': '2010',
    'zindex-message': '2010',
    'zindex-popover': '2030',
    'zindex-picker': '2050',
    'zindex-dropdown': '2050',
    'zindex-tooltip': '2060',
  },
  externals: {
    // '@antv/data-set': 'DataSet',
  },
  proxy: {
    '/api/': {
      target: '',
      changeOrigin: true,
    },
  },
  ignoreMomentLocale: true,
  manifest: {
    basePath: '/',
  },
  chainWebpack: webpackPlugin,
})
