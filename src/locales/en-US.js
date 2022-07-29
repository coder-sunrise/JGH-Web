import analysis from './en-US/analysis'
import exception from './en-US/exception'
import form from './en-US/form'
import globalHeader from './en-US/globalHeader'
import login from './en-US/login'
import menu from './en-US/menu'
import monitor from './en-US/monitor'
import result from './en-US/result'
import settingDrawer from './en-US/settingDrawer'
import settings from './en-US/settings'
import pwa from './en-US/pwa'
import patient from './en-US/patient'
import inventory from './en-US/inventory'
import sms from './en-US/sms'
import finance from './en-US/finance'
import reception from './en-US/reception'
import general from './en-US/general'
import claimsubmission from './en-US/claimSubmission'
import radiology from './en-US/radiology'
import pharmacy from './en-US/pharmacy'
import lab from './en-US/lab'

export default {
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  'app.home.introduce': 'introduce',
  'app.forms.basic.title': 'Basic form',
  'app.forms.basic.description':
    'Form pages are used to collect or verify information to users, and basic forms are common in scenarios where there are fewer data items.',
  ...general,
  ...analysis,
  ...exception,
  ...form,
  ...globalHeader,
  ...login,
  ...menu,
  ...monitor,
  ...result,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...patient,
  ...finance,
  ...reception,
  ...inventory,
  ...sms,
  ...claimsubmission,
  ...radiology,
  ...pharmacy,
  ...lab,
}
