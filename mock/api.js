import mockjs from 'mockjs'
import moment from 'moment'

const titles = [
  'Alipay',
  'Angular',
  'Ant Design',
  'SEMR V2',
  'Bootstrap',
  'React',
  'Vue',
  'Webpack',
  'NSCMH',
]
const avatars = [
  'https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png', // Alipay
  'https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png', // Angular
  'https://gw.alipayobjects.com/zos/rmsportal/dURIMkkrRFpPgTuzkwnB.png', // Ant Design
  'https://gw.alipayobjects.com/zos/rmsportal/sfjbOqnsXXJgNCjCzDBL.png', // SEMR V2
  'https://gw.alipayobjects.com/zos/rmsportal/siCrBXXhmvTQGWPNLBow.png', // Bootstrap
  'https://gw.alipayobjects.com/zos/rmsportal/kZzEzemZyKLKFsojXItE.png', // React
  'https://gw.alipayobjects.com/zos/rmsportal/ComBAopevLwENQdKWiIn.png', // Vue
  'https://gw.alipayobjects.com/zos/rmsportal/nxkuOJlFJuAUhzlMTCEe.png', // Webpack
]

const avatars2 = [
  'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
  'https://gw.alipayobjects.com/zos/rmsportal/cnrhVkzwxjPwAaCfPbdc.png',
  'https://gw.alipayobjects.com/zos/rmsportal/gaOngJwsRYRaVAuXXcmB.png',
  'https://gw.alipayobjects.com/zos/rmsportal/ubnKSIfAJTxIgXOKlciN.png',
  'https://gw.alipayobjects.com/zos/rmsportal/WhxKECPNujWoWEFNdnJE.png',
  'https://gw.alipayobjects.com/zos/rmsportal/jZUIxmJycoymBprLOUbT.png',
  'https://gw.alipayobjects.com/zos/rmsportal/psOgztMplJMGpVEqfcgF.png',
  'https://gw.alipayobjects.com/zos/rmsportal/ZpBqSxLxVEXfcUNoPKrz.png',
  'https://gw.alipayobjects.com/zos/rmsportal/laiEnJdGHVOhJrUShBaJ.png',
  'https://gw.alipayobjects.com/zos/rmsportal/UrQsqscbKEpNuJcvBZBu.png',
]

const covers = [
  'https://gw.alipayobjects.com/zos/rmsportal/uMfMFlvUuceEyPpotzlq.png',
  'https://gw.alipayobjects.com/zos/rmsportal/iZBVOIhGJiAnhplqjvZW.png',
  'https://gw.alipayobjects.com/zos/rmsportal/iXjVmWVHbCJAyqvDxdtx.png',
  'https://gw.alipayobjects.com/zos/rmsportal/gLaIAoVWTtLbBWZNYEMg.png',
]
const desc = [
  '那是一种内在的东西， 他们到达不了，也无法触及的',
  '希望是一个好东西，也许是最好的，好东西是不会消亡的',
  '生命就像一盒巧克力，结果往往出人意料',
  '城镇中有那么多的酒馆，她却偏偏走进了我的酒馆',
  '那时候我只会想自己想要什么，从不想自己拥有什么',
]

const user = [
  'Chris',
  'Patrik',
  'Teo Jiayan',
  'Jack',
  'Jason Wang',
  'Dave',
  'Zoe',
  'Lim Zhebin',
  'Bruce',
  'Zack',
]

const phoneNo = [
  '12345678',
  '11223344',
  '22113344',
  '54316789',
  '91827364',
  '11995533',
  '22118855',
  '32147658',
]

const company = [
  'ABC Agency PTE LTD',
  'AIA',
  'CHAS',
  'KTPH',
  'MEDISAVE',
  'Shenton Insurance',
]

const expenseType = [
  'Consumable draw out',
  'Ioren ipsum',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Aenean fringilla malesuada luctus.',
  'Phasellus id blandit ipsum.',
  'Quisque purus diam, mollis nec sollicitudin vitae, ullamcorper eget massa',
  'Vivamus non vehicula neque.',
  'Fusce tincidunt mattis luctus',
  'Quisque tempus laoreet tempor.',
  'Ne vim dolore audiam facilisis, at rebum partem has.',
]

function fakeList (count) {
  const list = []
  for (let i = 0; i < count; i += 1) {
    list.push({
      id: `fakelist${i}`,
      Id: `fakelist${i}`,
      owner: user[i % 10],
      title: titles[i % 8],
      avatar: avatars[i % 8],
      cover: parseInt(i / 4, 10) % 2 === 0 ? covers[i % 4] : covers[3 - i % 4],
      status: [
        '1',
        '0',
        '2',
      ][i % 3],
      percent: Math.ceil(Math.random() * 50) + 50,
      logo: avatars[i % 8],
      href: 'https://ant.design',
      updatedAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 2 * i),
      createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 2 * i),
      subDescription: desc[i % 5],
      description:
        '在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。',
      activeUser: Math.ceil(Math.random() * 100000) + 100000,
      newUser: Math.ceil(Math.random() * 1000) + 1000,
      star: Math.ceil(Math.random() * 100) + 100,
      like: Math.ceil(Math.random() * 100) + 100,
      message: Math.ceil(Math.random() * 10) + 10,
      content:
        '段落示意：蚂蚁金服设计平台 ant.design，用最小的工作量，无缝接入蚂蚁金服生态，提供跨越设计与开发的体验解决方案。蚂蚁金服设计平台 ant.design，用最小的工作量，无缝接入蚂蚁金服生态，提供跨越设计与开发的体验解决方案。',
      members: [
        {
          avatar:
            'https://gw.alipayobjects.com/zos/rmsportal/ZiESqWwCXBRQoaPONSJe.png',
          name: '曲丽丽',
          id: 'member1',
        },
        {
          avatar:
            'https://gw.alipayobjects.com/zos/rmsportal/tBOxZPlITHqwlGjsJWaF.png',
          name: '王昭君',
          id: 'member2',
        },
        {
          avatar:
            'https://gw.alipayobjects.com/zos/rmsportal/sBxjgqiuHMGRkIjqlQCd.png',
          name: '董娜娜',
          id: 'member3',
        },
      ],
      invoiceNo: `IV-${Math.ceil(Math.random() * 100000)}${100000}`,
      doctor: user[i % 10],
      refNo: `PT-${Math.ceil(Math.random() * 100000)}${100000}`,
      acctNo: `S${Math.ceil(Math.random() * 100000)}${100000}H`,
      patientName: `Patient${i}`,
      quantity: Math.ceil(Math.random() * 100) + 100,
      invoiceDate: moment()
        .add(Math.ceil(Math.random() * 100) - 100, 'days')
        .format('LLL'),
      date: moment().add(Math.ceil(Math.random() * 100) - 100, 'days'),
      totalAfterGST: (Math.ceil(Math.random() * 10000) + 10000) / 100,
      payments: Math.ceil(Math.random() * 100) + 100,
      creditNotes: Math.ceil(Math.random() * 100) + 100,
      debitNotes: Math.ceil(Math.random() * 100) + 100,
      osBal: Math.ceil(Math.random() * 100) + 100,

      expenseDate: moment()
        .add(Math.ceil(Math.random() * 100) - 100, 'days')
        .format('LLL'),
      expenseType: expenseType[i % 10],
      expenseDescription: expenseType[i % 10],
      expenseAmount: Math.ceil(Math.random() * 100) + 100,
      supplier: '1',
      lastPayment: moment()
        .add(Math.ceil(Math.random() * 100) - 100, 'days')
        .format('LLL'),
      outstandingBalance: Math.ceil(Math.random() * 100) + 100,
      contactPerson: user[i % 10],
      officeNo: phoneNo[i % 8],
      faxNo: phoneNo[i % 8],
      company: company[i % 6],
      depositNo: `DP-0${Math.ceil(Math.random() * 100000)}`,
      patientRefNo: `PT-000${Math.ceil(Math.random() * 100000)}`,
      copay: `${Math.random() >= 0.5 ? 'YES' : 'NO'}`,
      amount: Math.ceil(Math.random() * 100) + 100,
      balance: Math.ceil(Math.random() * 100) + 100,
      payAmount: 0,
      allergyName: `ALG-000${Math.ceil(Math.random() * 100000)}`,
    })
  }

  return list
}

let sourceData

function getFakeList (req, res) {
  const params = req.query

  const count = params.count * 1 || 20

  const result = fakeList(count)
  sourceData = result
  return res.json(result)
}

function postFakeList (req, res) {
  const { /* url = '', */ body } = req
  // const params = getUrlParams(url);
  const { method, id } = body
  // const count = (params.count * 1) || 20;
  let result = sourceData

  switch (method) {
    case 'delete':
      result = result.filter((item) => item.id !== id)
      break
    case 'update':
      result.forEach((item, i) => {
        if (item.id === id) {
          result[i] = Object.assign(item, body)
        }
      })
      break
    case 'post':
      result.unshift({
        body,
        id: `fake-list-${result.length}`,
        createdAt: new Date().getTime(),
      })
      break
    default:
      break
  }

  return res.json(result)
}

const getNotice = [
  {
    id: 'xxx1',
    title: titles[0],
    logo: avatars[0],
    description: '那是一种内在的东西，他们到达不了，也无法触及的',
    updatedAt: new Date(),
    member: '科学搬砖组',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx2',
    title: titles[1],
    logo: avatars[1],
    description: '希望是一个好东西，也许是最好的，好东西是不会消亡的',
    updatedAt: new Date('2017-07-24'),
    member: '全组都是吴彦祖',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx3',
    title: titles[2],
    logo: avatars[2],
    description: '城镇中有那么多的酒馆，她却偏偏走进了我的酒馆',
    updatedAt: new Date(),
    member: '中二少女团',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx4',
    title: titles[3],
    logo: avatars[3],
    description: '那时候我只会想自己想要什么，从不想自己拥有什么',
    updatedAt: new Date('2017-07-23'),
    member: '程序员日常',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx5',
    title: titles[4],
    logo: avatars[4],
    description: '凛冬将至',
    updatedAt: new Date('2017-07-23'),
    member: '高逼格设计天团',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx6',
    title: titles[5],
    logo: avatars[5],
    description: '生命就像一盒巧克力，结果往往出人意料',
    updatedAt: new Date('2017-07-23'),
    member: '骗你来学计算机',
    href: '',
    memberLink: '',
  },
]

const getActivities = [
  {
    id: 'trend-1',
    updatedAt: new Date(),
    user: {
      name: '曲丽丽',
      avatar: avatars2[0],
    },
    group: {
      name: '高逼格设计天团',
      link: 'http://github.com/',
    },
    project: {
      name: '六月迭代',
      link: 'http://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-2',
    updatedAt: new Date(),
    user: {
      name: '付小小',
      avatar: avatars2[1],
    },
    group: {
      name: '高逼格设计天团',
      link: 'http://github.com/',
    },
    project: {
      name: '六月迭代',
      link: 'http://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-3',
    updatedAt: new Date(),
    user: {
      name: '林东东',
      avatar: avatars2[2],
    },
    group: {
      name: '中二少女团',
      link: 'http://github.com/',
    },
    project: {
      name: '六月迭代',
      link: 'http://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-4',
    updatedAt: new Date(),
    user: {
      name: '周星星',
      avatar: avatars2[4],
    },
    project: {
      name: '5 月日常迭代',
      link: 'http://github.com/',
    },
    template: '将 @{project} 更新至已发布状态',
  },
  {
    id: 'trend-5',
    updatedAt: new Date(),
    user: {
      name: '朱偏右',
      avatar: avatars2[3],
    },
    project: {
      name: '工程效能',
      link: 'http://github.com/',
    },
    comment: {
      name: '留言',
      link: 'http://github.com/',
    },
    template: '在 @{project} 发布了 @{comment}',
  },
  {
    id: 'trend-6',
    updatedAt: new Date(),
    user: {
      name: '乐哥',
      avatar: avatars2[5],
    },
    group: {
      name: '程序员日常',
      link: 'http://github.com/',
    },
    project: {
      name: '品牌迭代',
      link: 'http://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
]

function getFakeCaptcha (req, res) {
  return res.json('captcha-xxx')
}

const fakePatientInfoList = [
  {
    patientID: 'PT-00001A',
    patientName: 'Alec Thompson',
    patientNRIC: 'S1234567D',
    gender: 'Male',
    dateOfBirth: '1978-06-02',
    nationality: 'Malaysian',
    contact: '12348765',
    age: 41,
  },
  {
    patientID: 'PT-00002A',
    patientName: 'Annie Marlson',
    patientNRIC: 'S3000033A',
    gender: 'Female',
    dateOfBirth: '1988-06-02',
    nationality: 'Singaporean',
    contact: '12345678',
    age: 31,
  },
]

const getFakePatientList = (req, res) => {
  return res.json(fakePatientInfoList)
}

const getFakePatientInfo = (req, res) => {
  const result = fakePatientInfoList.find(
    (patInfo) => patInfo.patientID === req.query.patientID,
  )
  if (result) {
    return res.json(result)
  }
  return res.json({ status_code: 404 })
}

export default {
  'GET /api/project/notice': getNotice,
  'GET /api/activities': getActivities,
  'POST /api/forms': (req, res) => {
    res.send({ message: 'Ok' })
  },
  'GET /api/tags': mockjs.mock({
    'list|100': [
      { name: '@city', 'value|1-100': 150, 'type|0-2': 1 },
    ],
  }),
  'GET /api/fake_list': getFakeList,
  'POST /api/fake_list': postFakeList,
  'GET /api/captcha': getFakeCaptcha,
  'GET /api/fake_patientInfo': getFakePatientInfo,
  'GET /api/fake_patientList': getFakePatientList,
}
