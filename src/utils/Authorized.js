import RenderAuthorized from '@/components/Authorized'
import { getAuthority } from './authority'

const rights = getAuthority()
let Authorized = RenderAuthorized(rights) // eslint-disable-line
// console.log(getAuthority(), Authorized)
// Reload the rights component
const reloadAuthorized = () => {
  const newRights = getAuthority()
  Authorized = RenderAuthorized(newRights)
}
// console.log('RenderAuthorized', RenderAuthorized)
const HiddenWhenDisable = [
  'queue.consultation.form',
  'queue.servepatient',
]
export { reloadAuthorized, HiddenWhenDisable }
export default Authorized
