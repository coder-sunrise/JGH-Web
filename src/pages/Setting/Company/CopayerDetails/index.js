import React, { useEffect, useState } from 'react'
import { connect } from 'dva'
import Yup from '@/utils/yup'
import { Space, Tooltip } from 'antd'
import { withStyles } from '@material-ui/core/styles'
import { compose } from 'redux'
import { navigateDirtyCheck } from '@/utils/utils'
import AuthorizedContext from '@/components/Context/Authorized'
import {
  withFormikExtend,
  FastField,
  Field,
  Tabs,
  CardContainer,
  Button,
  ProgressButton,
  CommonModal,
} from '@/components'
import AttachmentDocument from '@/pages/Widgets/AttachmentDocument'
import { FOLDER_TYPE } from '@/utils/constants'
import Authorized from '@/utils/Authorized'
import { General } from './General'
import { ContactPersonList } from './ContactPersonList'
import { InformationList } from './InformationList'
import withWebSocket from '@/components/Decorator/withWebSocket'
import { getRawData } from '@/services/report'
import { REPORT_ID } from '@/utils/constants'

const styles = () => ({
  actionDiv: {
    textAlign: 'center',
  },
})

const getTabContent = (tabName, props) => {
  const { height } = props
  if (tabName === 'General') {
    const editDetailAccessRight = Authorized.check(
      'copayer.copayerdetails',
    ) || {
      rights: 'hidden',
    }
    const enableEditDetails =
      !props.values.id || editDetailAccessRight.rights === 'enable'
    return (
      <CardContainer
        hideHeader
        style={{
          height: height,
          overflowX: 'hidden',
        }}
      >
        <Space direction='vertical'>
          <AuthorizedContext.Provider
            value={{
              rights: enableEditDetails ? 'enable' : 'disable',
            }}
          >
            <General {...props} />
          </AuthorizedContext.Provider>
          <ContactPersonList {...props} enableEditDetails={enableEditDetails} />
          <InformationList {...props} enableEditDetails={enableEditDetails} />
        </Space>
      </CardContainer>
    )
  }
}

const copayerDetailTabs = props => {
  if (props.values.id)
    return [
      {
        id: 0,
        name: <span>Details</span>,
        content: getTabContent('General', props),
      },
      {
        id: 1,
        name: <span>Documents</span>,
        content: getTabContent('Documents', props),
      },
    ]
  return [
    {
      id: 0,
      name: <span>Details</span>,
      content: getTabContent('General', props),
    },
  ]
}

const Detail = props => {
  const { classes, theme, height, fromCommonModal = false, onClose } = props
  const { copayerDetail, clinicSettings } = props
  const { handleSubmit } = props

  const spacingSize = theme.spacing(1)

  const [editingLists, setEditingLists] = useState([])
  const [activeTabIndex, setActiveTabIndex] = useState('0')
  const [showDocument, setShowDocument] = useState(false)

  const printLabel = async (copayerId, contactPersonName) => {
    if (!Number.isInteger(copayerId)) return
    const { handlePrint, clinicSettings } = props
    const { labelPrinterSize } = clinicSettings.settings

    const sizeConverter = sizeCM => {
      return sizeCM
        .split('x')
        .map(o =>
          (10 * parseFloat(o.replace('cm', ''))).toString().concat('MM'),
        )
        .join('_')
    }
    const reportID =
      REPORT_ID[
        'COPAYER_ADDRESS_LABEL_'.concat(sizeConverter(labelPrinterSize))
      ]

    const data = await getRawData(reportID, {
      copayerId,
      contactPersonName: contactPersonName ? contactPersonName : '',
    })
    const payload = [
      {
        ReportId: reportID,
        ReportData: JSON.stringify({
          ...data,
        }),
      },
    ]
    handlePrint(JSON.stringify(payload))
  }
  const printCoverPage = async (
    copayerId,
    contactPersonName,
    coverPageCopies,
  ) => {
    const { dispatch, handlePrint } = props
    dispatch({
      type: 'copayerDetail/queryCopayerDetails',
      payload: {
        id: copayerId,
      },
    }).then(r => {
      if (!r) return
      const data = {}
      let information = {}
      information.Title = contactPersonName ? contactPersonName : r.displayValue
      if (r.address) {
        let address = r?.address || {}
        information.Content = `${
          contactPersonName ? r.displayValue + '\n' : ''
        }${address.blockNo || ''}${
          address.street ? (address.blockNo ? ' ' : '') + address.street : ''
        }${address.blockNo || address.street ? '\n' : ''}${address.unitNo ||
          ''}${
          address.buildingName
            ? (address.unitNo ? ' ' : '') + address.buildingName
            : ''
        }${
          address.unitNo || address.buildingName ? '\n' : ''
        }${address.countryName || ''}${
          address.postcode
            ? (address.countryName ? ' ' : '') + address.postcode
            : ''
        }`
      }
      data.MailingInformation = [information]
      const payload = [
        {
          ReportId: 95,
          ReportData: JSON.stringify(data),
          Copies: coverPageCopies,
        },
      ]
      handlePrint(JSON.stringify(payload))
    })
  }
  const onEditingList = (listName, isEditing) => {
    let newEditingList = []

    if (isEditing) {
      newEditingList = editingLists.concat(listName)
    } else {
      if (editingLists && editingLists.length > 0) {
        newEditingList = editingLists.filter(function(x) {
          return x !== listName
        })
      }
    }

    setEditingLists(newEditingList)
  }

  const compProps = {
    onPrint: printLabel,
    OnPrintCoverPage: printCoverPage,
    onEditingListControl: onEditingList,
    ...props,
    height: fromCommonModal
      ? height - 130
      : `calc(100vh - ${183 + theme.spacing(1)}px)`,
  }

  const ActionButtons = () => {
    const editDetailAccessRight = Authorized.check(
      'copayer.copayerdetails',
    ) || {
      rights: 'hidden',
    }
    const enableEditDetails =
      !props.values.id || editDetailAccessRight.rights === 'enable'
    const disabledSaveButton = editingLists && editingLists.length > 0
    let saveButton = (
      <ProgressButton
        disabled={!enableEditDetails || disabledSaveButton}
        submitKey='schemeDetail/submit'
        onClick={handleSubmit}
      />
    )

    if (disabledSaveButton) {
      saveButton = (
        <Tooltip
          title={`Complete edit ${editingLists[0]} to save`}
          placement='top'
        >
          <span>{saveButton}</span>
        </Tooltip>
      )
    }

    return (
      <React.Fragment>
        <Button
          authority='none'
          color='danger'
          onClick={
            fromCommonModal
              ? onClose
              : navigateDirtyCheck({ redirectUrl: '/finance/copayer' })
          }
        >
          Close
        </Button>
        {saveButton}
      </React.Fragment>
    )
  }

  const addDocumentAccessRight = Authorized.check('copayer.adddocument') || {
    rights: 'hidden',
  }
  const deleteDocumentAccessRight = Authorized.check(
    'copayer.deletedocument',
  ) || {
    rights: 'hidden',
  }

  return (
    <React.Fragment>
      <Tabs
        style={{ marginTop: theme.spacing(1) }}
        activeKey={activeTabIndex}
        options={copayerDetailTabs(compProps)}
        onChange={key => {
          setActiveTabIndex(key)
          if (key === '1') {
            setShowDocument(true)
          }
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <ActionButtons {...props} />
      </div>
      <CommonModal
        open={showDocument}
        fullScreen
        onClose={() => {
          setShowDocument(false)
          setActiveTabIndex('0')
        }}
        title='Co-Payer Document'
        keepMounted={false}
        showFooter={true}
        footProps={{
          confirmProps: {
            hidden: true,
          },
        }}
      >
        <div>
          <div style={{ marginLeft: 8, marginTop: '-10px' }}>
            Co-Payer:&nbsp;
            <span style={{ fontWeight: 600 }}>{props.values.code}</span>
            &nbsp;-&nbsp;
            <span>{props.values.displayValue}</span>
          </div>
          <AttachmentDocument
            {...props}
            coPayerFK={props.values.id}
            type={FOLDER_TYPE.COPAYER}
            modelName='coPayerAttachment'
            isEnableEditDocument={addDocumentAccessRight.rights === 'enable'}
            isEnableDeleteDocument={
              deleteDocumentAccessRight.rights === 'enable'
            }
            isEnableEditFolder={addDocumentAccessRight.rights === 'enable'}
            isEnableDeleteFolder={deleteDocumentAccessRight.rights === 'enable'}
          />
        </div>
      </CommonModal>
    </React.Fragment>
  )
}

export default compose(
  withStyles(styles, { withTheme: true }),
  connect(({ copayerDetail, clinicSettings }) => ({
    copayerDetail,
    clinicSettings,
  })),
  withFormikExtend({
    // authority: [
    //   'copayer.copayerDetail',
    //   'copayer.newcopayer',
    // ],
    displayName: 'copayerDetails',
    enableReinitialize: true,
    mapPropsToValues: ({ copayerDetail }) => {
      return copayerDetail.entity ? copayerDetail.entity : copayerDetail.default
    },
    validationSchema: Yup.object().shape({
      code: Yup.string().max(
        20,
        'Co-Payer Code should not exceed 20 characters',
      ),
      displayValue: Yup.string()
        .required()
        .max(200, 'Co-Payer Name should not exceed 200 characters'),
      coPayerTypeFK: Yup.number().required(),
      defaultStatementAdjustmentRemarks: Yup.string().when(
        ['isAutoGenerateStatementEnabled', 'statementAdjustment'],
        (isAutoGenerateStatementEnabled, statementAdjustment) => {
          if (isAutoGenerateStatementEnabled && statementAdjustment > 0)
            return Yup.string().required()
        },
      ),
      effectiveDates: Yup.array()
        .of(Yup.date())
        .min(2)
        .required(),
      creditInformation: Yup.string().max(
        300,
        'Credit Information should not exceed 300 characters',
      ),
      remark: Yup.string().max(200, 'Remarks should not exceed 200 characters'),
      website: Yup.string().max(
        100,
        'Website should not exceed 100 characters',
      ),
      address: Yup.object().shape({
        postcode: Yup.string().max(
          10,
          'Postcode should not exceed 10 characters',
        ),
        blockNo: Yup.string().max(
          500,
          'Block No should not exceed 500 characters',
        ),
        unitNo: Yup.string().max(
          500,
          'Unit No should not exceed 500 characters',
        ),
        street: Yup.string().max(
          500,
          'Street should not exceed 500 characters',
        ),
        buildingName: Yup.string().max(
          500,
          'Building Name should not exceed 500 characters',
        ),
      }),
    }),
    handleSubmit: (values, { props }) => {
      const { dispatch, history, fromCommonModal = false, onConfirm } = props
      const { effectiveDates, ...restValues } = values

      const actionPayload = {
        ...restValues,
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
        companyTypeFK: 1,
        companyTypeName: 'copayer',
      }

      dispatch({
        type: 'copayerDetail/upsert',
        payload: { ...actionPayload },
      }).then(result => {
        if (result !== false) {
          if (fromCommonModal) {
            if (onConfirm) {
              onConfirm()
            }
          } else {
            history.push('/finance/copayer')
          }
        }
      })
    },
  }),
  withWebSocket(),
)(Detail)
