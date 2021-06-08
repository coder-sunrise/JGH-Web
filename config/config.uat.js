// https://umijs.org/config/
import os from 'os'
import pageRoutes from './router.config'
import webpackPlugin from './plugin.config'
import defaultSettings from '../src/defaultSettings'
// import { primaryColor } from '../src/assets/jss/index'

const plugins = [
  [
    'umi-plugin-react',
    {
      antd: true,
      dva: {
        hmr: true,
      },
      targets: {
        ie: 11,
      },
      locale: {
        enable: true, // default false
        default: 'en-US', // default zh-CN
        baseNavigator: true, // default true, when it is true, will use `navigator.language` overwrite default
      },
      dynamicImport: {
        loadingComponent: './components/PageLoading/index',
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
              include: [ 'dva', 'dva/router', 'dva/saga', 'dva/fetch' ],
              exclude: [ '@babel/runtime' ],
            },
            hardSource: true,
          }
        : {}),
    },
  ],
]

export default {
  // add for transfer to umi
  plugins,
  targets: {
    ie: 11,
  },
  hash: true,
  define: {
    APP_TYPE: process.env.APP_TYPE || '',
    'process.env.client_env': 'uat',
    'process.env.client_secret': '20e392d2ea9bfa76f2a9cb26c31a34d675ad81281a31f89ed5d572de8da0b9e7',
    'process.env.url': 'https://jghapi-development.azurewebsites.net',
    'process.env.signalrUrl': 'https://medicloud-uat-websocket-200729.semr2.com/notificationHub',
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
    'font-size-base': '1rem',
    'font-size-lg': '1.2rem',
    'font-size-sm': '0.9rem',
    'zindex-notification': 2010,
    'zindex-message': 2010,
    'zindex-popover': 2030,
    'zindex-picker': 2050,
    'zindex-dropdown': 2050,
    'zindex-tooltip': 2060,
  },
  externals: {
    // '@antv/data-set': 'DataSet',
  },
  proxy: {
    '/api/': {
      target: 'https://semr2uat2010.emr.com.sg/api/',
      changeOrigin: true,
    },
  },
  ignoreMomentLocale: true,
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  disableRedirectHoist: true,
  cssLoaderOptions: {
    modules: true,
    getLocalIdent: (context, localIdentName, localName) => {
      if (
        context.resourcePath.includes('node_modules') ||
        context.resourcePath.includes('ant.design.pro.less') ||
        context.resourcePath.includes('global.less') ||
        context.resourcePath.includes('global.scss')
      ) {
        return localName
      }
      const match = context.resourcePath.match(/src(.*)/)
      if (match && match[1]) {
        const antdProPath = match[1].replace('.less', '').replace('.scss', '')
        const arr = antdProPath.split('/').map((a) => a.replace(/([A-Z])/g, '-$1')).map((a) => a.toLowerCase())
        return `antd-pro${arr.join('-')}-${localName}`.replace(/--/g, '-')
      }
      return localName
    },
  },
  manifest: {
    basePath: '/',
  },
  chainWebpack: webpackPlugin,
}
