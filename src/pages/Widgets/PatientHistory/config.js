import Loadable from 'react-loadable'
import Loading from '@/components/PageLoading/index'

export const WIDGETS_ID = {
  CLINICAL_NOTE: '1',
  CHIEF_COMPLAINTS: '2',
  PLAN: '3',
  ASSOCIATED_HISTORY: '3',
  INTRA_ORAL: '4',
  EXTRA_ORAL: '5',
  ATTACHMENT: '6',
  ORDERS: '7',
  INVOICE: '8',
  DENTAL_CHART: '9',
  TREATMENT: '10',
}

export const widgets = (props, scribbleNoteUpdateState = () => {}) => [
  {
    id: '1',
    name: 'Clinical Notes',
    authority: 'queue.consultation.clinicalnotes.clinicalnotes',
    component: Loadable({
      loader: () => import('./Notes'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return (
          <Cmpnet
            {...props}
            {...p}
            scribbleNoteUpdateState={scribbleNoteUpdateState}
            fieldName='note'
          />
        )
      },
      loading: Loading,
    }),
  },
  {
    id: '2',
    name: 'Chief Complaints',
    authority: 'queue.consultation.clinicalnotes.chiefcomplaints',
    component: Loadable({
      loader: () => import('./Notes'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return (
          <Cmpnet
            {...props}
            {...p}
            scribbleNoteUpdateState={scribbleNoteUpdateState}
            fieldName='chiefComplaints'
          />
        )
      },
      loading: Loading,
    }),
  },
  {
    id: '11',
    name: 'Plan',
    authority: 'queue.consultation.clinicalnotes.plan',
    component: Loadable({
      loader: () => import('./Notes'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return (
          <Cmpnet
            {...props}
            scribbleNoteUpdateState={scribbleNoteUpdateState}
            {...p}
            fieldName='plan'
          />
        )
      },
      loading: Loading,
    }),
  },
  {
    id: '12',
    name: 'Diagnosis',
    authority: 'queue.consultation.widgets.diagnosis',
    component: Loadable({
      loader: () => import('./Diagnosis'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} />
      },
      loading: Loading,
    }),
  },
  {
    id: '3',
    name: 'Associated History',
    authority: 'queue.consultation.clinicalnotes.associatedhistory',
    component: Loadable({
      loader: () => import('./Notes'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} fieldName='associatedHistory' />
      },
      loading: Loading,
    }),
  },
  {
    id: '4',
    name: 'Intra Oral',
    authority: 'queue.consultation.clinicalnotes.intraoral',
    component: Loadable({
      loader: () => import('./Notes'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} fieldName='intraOral' />
      },
      loading: Loading,
    }),
  },
  {
    id: '5',
    name: 'Extra Oral',
    authority: 'queue.consultation.clinicalnotes.extraoral',
    component: Loadable({
      loader: () => import('./Notes'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} fieldName='extraOral' />
      },
      loading: Loading,
    }),
  },
  {
    id: '6',
    name: 'Attachment',
    authority: 'queue.consultation.widgets.attachment',
    component: Loadable({
      loader: () => import('./Attachment'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} />
      },
      loading: Loading,
    }),
  },
  {
    id: '7',
    name: 'Orders',
    authority: 'queue.consultation.widgets.order',
    component: Loadable({
      loader: () => import('./Orders'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} />
      },
      loading: Loading,
    }),
  },
  {
    id: '9',
    name: 'Dental Chart',
    authority: 'queue.consultation.widgets.dentalchart',
    component: Loadable({
      loader: () => import('./DentalChart/index'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} />
      },
      loading: Loading,
    }),
  },
  {
    id: '10',
    name: 'Treatment',
    authority: 'queue.consultation.widgets.dentalchart',
    component: Loadable({
      loader: () => import('./Treatment/index'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} />
      },
      loading: Loading,
    }),
  },
  {
    id: '8',
    name: 'Invoice',
    authority: 'queue.consultation.widgets.order',
    component: Loadable({
      loader: () => import('./Invoice'),
      render: (loaded, p) => {
        let Cmpnet = loaded.default
        return <Cmpnet {...props} {...p} />
      },
      loading: Loading,
    }),
  },
]
