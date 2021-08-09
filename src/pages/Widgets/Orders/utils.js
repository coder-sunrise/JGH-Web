import { Table } from 'antd'
import moment from 'moment'
import { Divider } from '@material-ui/core'
import Authorized from '@/utils/Authorized'
import { htmlDecodeByRegExp } from '@/utils/utils'
import { tagList } from '@/utils/codes'
import { DOSAGE_RULE, DOSAGE_RULE_OPERATOR } from '@/utils/constants'
import tablestyles from '@/pages/Widgets/PatientHistory/PatientHistoryStyle.less'

const getCautionAlertContent = (cautionItems = [], allergyItems = [], vaccinationItems = []) => () => {
  return (
    <div
      style={{
        minHeight: 80,
        display: 'grid',
        alignItems: 'center',
      }}
    >
      <div style={{ margin: 5 }}>
        {allergyItems.length > 0 && (
          <div>
            <p>
              <h4
                style={{ fontWeight: 400, textAlign: 'left', marginBottom: 10 }}
              >
                Patient Allergy
              </h4>
            </p>
            <Table
              size='small'
              bordered
              pagination={false}
              columns={[
                {
                  dataIndex: 'drugName',
                  title: 'Medication Name',
                  width: 200,
                },
                {
                  dataIndex: 'allergyName',
                  title: 'Allergy Name',
                },
                {
                  dataIndex: 'allergyType',
                  title: 'Allergy Type',
                  width: 100,
                },
                {
                  dataIndex: 'allergyReaction',
                  title: 'Allergy Reaction',
                  width: 150,
                },
                {
                  dataIndex: 'onsetDate',
                  title: 'Onset Date',
                  width: 100,
                  render: (text, row) => <span>{row.onsetDate ? moment(row.onsetDate).format("DD MMM YYYY") : '-'}</span>
                }
              ]}
              dataSource={allergyItems}
              rowClassName={(record, index) => {
                return index % 2 === 0 ? tablestyles.once : tablestyles.two
              }}
              className={tablestyles.table}
            />
          </div>
        )}
      </div>
      <div style={{ margin: 5 }}>
        {cautionItems.length > 0 && (
          <div>
            <p>
              <h4
                style={{ fontWeight: 400, textAlign: 'left', marginBottom: 10 }}
              >
                Cautions
              </h4>
            </p>
            <Table
              size='small'
              bordered
              pagination={false}
              columns={[
                {
                  dataIndex: 'type',
                  title: 'Type',
                  width: 100,
                },
                {
                  dataIndex: 'subject',
                  title: 'Name',
                  width: 200,
                },
                {
                  dataIndex: 'caution',
                  title: 'Cautions',
                }
              ]}
              dataSource={cautionItems}
              rowClassName={(record, index) => {
                return index % 2 === 0 ? tablestyles.once : tablestyles.two
              }}
              className={tablestyles.table}
            />
          </div>
        )}
      </div>
      <div style={{ margin: 5 }}>
        {vaccinationItems.length > 0 && (
          <div>
            <p>
              <h4
                style={{ fontWeight: 400, textAlign: 'left', marginBottom: 10 }}
              >
                Vaccination item(s) will not to ne added.
              </h4>
            </p>
            <Table
              size='small'
              bordered
              pagination={false}
              columns={[
                {
                  dataIndex: 'subject',
                  title: 'Vaccination Name',
                  width: 700,
                },
              ]}
              dataSource={vaccinationItems}
              rowClassName={(record, index) => {
                return index % 2 === 0 ? tablestyles.once : tablestyles.two
              }}
              className={tablestyles.table}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const openCautionAlertPrompt = (cautionItems = [], allergyItems = [], vaccinationItems = [], onClose) => {
  window.g_app._store.dispatch({
    type: 'global/updateAppState',
    payload: {
      openConfirm: true,
      isInformType: true,
      customWidth: 'md',
      openConfirmContent: getCautionAlertContent(cautionItems, allergyItems, vaccinationItems),
      openConfirmText: 'OK',
      onConfirmClose: onClose,
    },
  })
}

const openCautionAlertOnStartConsultation = (o) => {
  const { corPrescriptionItem = [], corVaccinationItem = [], drugAllergys = [] } = o
  const drugItems = corPrescriptionItem
    .filter((i) => i.caution && i.caution.trim().length > 0)
    .map((m) => {
      return { type: 'Medication', subject: m.drugName, caution: m.caution }
    })
  const vaccinationItems = corVaccinationItem
    .filter((i) => i.caution && i.caution.trim().length > 0)
    .map((m) => {
      return { type: 'Vaccination', subject: m.vaccinationName, caution: m.caution }
    })
  const cautionItems = [
    ...drugItems,
    ...vaccinationItems,
  ]

  if (cautionItems.length) {
    openCautionAlertPrompt(cautionItems, drugAllergys, [])
  }
}

const GetOrderItemAccessRight = (from = 'Consultation', accessRight) => {
  let editAccessRight = accessRight
  let strOrderAccessRight = ''
  if (from === 'EditOrder') {
    strOrderAccessRight = 'queue.dispense.editorder'
  } else if (from === 'Consultation') {
    strOrderAccessRight = 'queue.consultation.widgets.order'
  }
  const orderAccessRight = Authorized.check(strOrderAccessRight)
  if (!orderAccessRight || orderAccessRight.rights !== 'enable') {
    editAccessRight = strOrderAccessRight
  }
  return editAccessRight
}

const ReplaceCertificateTeplate = (templateContent, newVaccination) => {
  const templateReg = /<a.*?data-value="(.*?)".*?<\/a>/gm
  let msg = htmlDecodeByRegExp(templateContent)
  const match = msg.match(templateReg) || []
  match.forEach((s) => {
    const value = s.match(/data-value="(.*?)"/)[1]
    const m = tagList.find((o) => o.value === value)
    if (m && m.getter) msg = msg.replace(s, m.getter(newVaccination))
  })
  return msg
}

const isMatchInstructionRule = (rule, age, weight) => {
  let isMatch = false;
  if (rule.ruleType == DOSAGE_RULE.default) {
    isMatch = true;
  }
  else if (rule.ruleType == DOSAGE_RULE.age) {
    if (age >= 0) {
      if ((rule.operator == DOSAGE_RULE_OPERATOR.to && age >= rule.leftOperand && age <= rule.rightOperand)
        || (rule.operator == DOSAGE_RULE_OPERATOR.lessThan && age < rule.rightOperand)
        || (rule.operator == DOSAGE_RULE_OPERATOR.moreThan && age > rule.rightOperand)) {
        isMatch = true;
      }
    }
  }
  else if (rule.ruleType == DOSAGE_RULE.weight) {
    if (weight >= 0) {
      if ((rule.operator == DOSAGE_RULE_OPERATOR.to && weight >= rule.leftOperand && weight <= rule.rightOperand)
        || (rule.operator == DOSAGE_RULE_OPERATOR.lessThan && weight < rule.rightOperand)
        || (rule.operator == DOSAGE_RULE_OPERATOR.moreThan && weight > rule.rightOperand)) {
        isMatch = true;
      }
    }
  }
  return isMatch;
}

export {
  getCautionAlertContent,
  openCautionAlertPrompt,
  openCautionAlertOnStartConsultation,
  GetOrderItemAccessRight,
  ReplaceCertificateTeplate,
  isMatchInstructionRule,
}
