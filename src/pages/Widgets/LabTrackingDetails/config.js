import Loadable from 'react-loadable'
import Loading from '@/components/PageLoading/index'

export const WIDGETS_ID = {
  LAB_TRACKING_DETAILS: 1,
  LAB_RESULTS: 2,
}

export const widgets = (props, setShowMessage) => [
         {
           id: WIDGETS_ID.LAB_TRACKING_DETAILS,
           name: 'External Tracking Details',
           component: Loadable({
             loader: () => import('./LabDetails'),
             render: (loaded, p) => {
               let Cmpnet = loaded.default
               return (
                 <Cmpnet
                   {...props}
                   {...p}
                   setShowMessage={setShowMessage}
                   fieldName='LabDetails'
                 />
               )
             },
             loading: Loading,
           }),
         },
         {
           id: WIDGETS_ID.LAB_RESULTS,
           name: 'Results',
           component: Loadable({
             loader: () => import('./LabResult'),
             render: (loaded, p) => {
               let Cmpnet = loaded.default
               return <Cmpnet {...props} {...p} fieldName='LabResult' />
             },
             loading: Loading,
           }),
         },
       ]
