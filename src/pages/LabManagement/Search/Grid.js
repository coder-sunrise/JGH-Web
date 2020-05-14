import React, { PureComponent } from 'react'
import Assignment from '@material-ui/icons/Assignment'
import SyncAlt from '@material-ui/icons/SyncAlt'
import { statusString } from '@/utils/codes'
import { CommonTableGrid, Tooltip, Button, CardContainer } from '@/components'
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import Authorized from '@/utils/Authorized'

const data = [
  {
    id: 1,
    ward: 'ICU',
    bed: 'I1',
    name: 'Abu Bin',
    age: 43,
    patientId: 'PT-000017',
    orderId: 'OD-000003',
    orderDate: '2019-10-11',
    serviceCentre: 'Innovative Diagnostic',
    serviceCategory: 'Procedure',
    serviceName: 'Anti-HIV',
    doctor: 'Doctor A',
    status: 'Ordered',
    lastUpdatedBy: 'Demo',
  },
  {
    id: 2,

    ward: 'ICU',
    bed: 'I2',
    name: 'Albert',
    age: 22,
    patientId: 'PT-000018',
    orderId: 'OD-000004',
    orderDate: '2019-10-11',
    serviceCentre: 'Innovative Diagnostic',
    serviceCategory: 'Procedure',
    serviceName: 'Service 2',
    doctor: 'Doctor A',
    status: 'Ordered',
    lastUpdatedBy: 'Demo',
  },
  {
    id: 3,

    ward: 'ICU',
    bed: 'I3',
    name: 'Atreus',
    age: 33,
    patientId: 'PT-000019',
    orderId: 'OD-000005',
    orderDate: '2019-10-13',
    serviceCentre: 'Innovative Diagnostic',
    serviceCategory: 'Investigation',
    serviceName: 'Service 1',
    doctor: 'Doctor A',
    status: 'Ordered',
    lastUpdatedBy: 'Demo',
  },
  {
    id: 4,

    ward: 'ICU',
    bed: 'I4',
    name: 'Chandler',
    age: 55,
    patientId: 'PT-000020',
    orderId: 'OD-000006',
    orderDate: '2019-10-13',
    serviceCentre: 'Innovative Diagnostic',
    serviceCategory: 'Investigation',
    serviceName: 'Service 1',
    doctor: 'Doctor A',
    status: 'Ordered',
    lastUpdatedBy: 'Demo',
  },
  {
    id: 5,

    ward: 'Special',
    bed: 'S1',
    name: 'Chandler',
    age: 55,
    patientId: 'PT-000030',
    orderId: 'OD-000016',
    orderDate: '2019-10-11',
    serviceCentre: 'Innovative Diagnostic',
    serviceCategory: 'Investigation',
    serviceName: 'Service 3',
    doctor: 'Doctor C',
    status: 'Ordered',
    lastUpdatedBy: 'Demo',
  },
]
class Grid extends PureComponent {
  state = {}

  constructor (props) {
    super(props)

    this.tableParas = {
      columns: [
        { name: 'orderId', title: 'Order ID' },
        { name: 'orderDate', title: 'Order Date' },
        { name: 'serviceCentre', title: 'Service Center' },
        { name: 'serviceCategory', title: 'Service Category' },
        { name: 'serviceName', title: 'Service Name' },
        { name: 'patientId', title: 'Patient ID' },
        { name: 'name', title: 'Patient Name' },
        { name: 'doctor', title: 'Doctor' },
        { name: 'status', title: 'Status' },
        { name: 'receivedDate', title: 'Received Date' },
        { name: 'remarks', title: 'Remarks' },
        { name: 'lastUpdatedBy', title: 'Last Updated By' },
        { name: 'action', title: 'Action' },
      ],
      columnExtensions: [
        {
          columnName: 'orderDate',
          type: 'date',
        },
        {
          columnName: 'receivedDate',
          type: 'date',
        },
        {
          columnName: 'serviceCentre',
          width: 180,
        },
        {
          columnName: 'action',
          align: 'center',
          sortingEnabled: false,
          render: (row) => {
            const { renderActionFn = (f) => f } = props
            return (
              <div>
                <Tooltip title='Detail'>
                  <Button
                    onClick={() => {
                      // this.onAddExistPatient(row)
                    }}
                    justIcon
                    color='primary'
                  >
                    <Assignment />
                  </Button>
                </Tooltip>
              </div>
            )
          },
        },
      ],
      // FuncProps: {
      //   pager: false,

      // },
    }
  }

  render () {
    const { overrideTableParas = {} } = this.props

    return (
      <React.Fragment>
        <CommonTableGrid
          rows={data}
          {...this.tableParas}
          {...overrideTableParas}
        />
      </React.Fragment>
    )
  }
}

export default Grid
