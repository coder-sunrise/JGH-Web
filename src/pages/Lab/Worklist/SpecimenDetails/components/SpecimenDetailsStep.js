import { Steps } from 'antd'
import moment from 'moment'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { LAB_SPECIMEN_DETAILS_STEP } from '@/utils/constants'
import { dateFormatLongWithTimeNoSec } from '@/components'
import styles from './SpecimenDetailsStep.less'

const { Step } = Steps

const CompletedStep = () => <CheckCircleFilled style={{ color: '#33CC33' }} />

const NextStep = () => (
  <div
    style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#33CC33',
    }}
  ></div>
)

const DefaultStep = () => (
  <div
    style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#999999',
    }}
  ></div>
)

export const SpecimenDetailsStep = ({ timeline = [] }) => {
  const nextStep = (() => {
    const remainingSteps = timeline.filter(
      step => step.actionDate === null || step.actionDate === undefined,
    )

    if (remainingSteps && remainingSteps.length > 0) return remainingSteps[0]
  })()

  const renderIcon = currentStep => {
    if (currentStep.actionDate) return <CompletedStep />
    if (nextStep && nextStep.status === currentStep.status) return <NextStep />

    return <DefaultStep />
  }

  const renderStep = currentStep => {
    return (
      <Step
        title={<span style={{ fontWeight: 500 }}>{currentStep.status}</span>}
        icon={renderIcon(currentStep)}
        subTitle={currentStep.actionUserName ? currentStep.actionUserName : ''}
        description={
          currentStep.actionDate
            ? moment(currentStep.actionDate).format('DD MMM YYYY HH:mm')
            : ''
        }
      />
    )
  }

  return (
    <div>
      <Steps
        className={styles.specimenDetailsStep}
        size='small'
        labelPlacement='vertical'
      >
        {timeline &&
          timeline.map(step => {
            return renderStep(step)
          })}
      </Steps>
    </div>
  )
}
