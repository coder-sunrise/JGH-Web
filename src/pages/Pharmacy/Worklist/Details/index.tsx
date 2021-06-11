import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'dva'
import { Steps } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import { Tooltip } from '@/components'
import Banner from '@/pages/PatientDashboard/Banner'
import OrderDetails from '../OrderDetails'
import styles from './index.less'

const DispensaryDetails = ({ id = 7 }) => {
  const patient = useSelector(state => state.patient)
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch({ type: 'dispensaryDetails/initState', payload: { id: 7 } })
  }, [id])

  const { Step } = Steps
  return (
    <div>
      <Banner patientInfo={patient} style={{ display: 'block' }} />
      <div style={{ padding: '80px' }} className='order-steps'>
        <Steps
          className={styles.orderStatus}
          size='small'
          labelPlacement='vertical'
          current={2}
        >
          <Step title='Order' icon={<CheckCircleFilled />} />

          <Step
            title='Prepared'
            icon={<CheckCircleFilled />}
            subTitle={
              <div>
                <div>Dr. Nikaido Malaya Glian Stacy Neo Jerry White</div>
                <div>23 Apr 2021 10:13 AM</div>
              </div>
            }
          />
          <Step
            title='Verified'
            subTitle={
              <div>
                <div> Dr. Nikaido Malaya Glian Stacy Neo Yuchen</div>
                <div>23 Apr 2021 10:13 AM</div>
              </div>
            }
          />
          <Step title='Dispensed' />
          <Step title='Completed' />
        </Steps>
      </div>
      <OrderDetails />
    </div>
  )
}

export default DispensaryDetails
