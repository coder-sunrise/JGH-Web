import React, { Component, useState } from 'react'
import Print from '@material-ui/icons/Print'
import { Button, Tooltip, CommonModal } from '@/components'
import { ReportViewer } from '@/components/_medisys'
import MenuItem from '@material-ui/core/MenuItem'
import Menu from '@material-ui/core/Menu'
import DrugLeafletSelection from './DrugLeafletSelection'
import DrugLabelSelection from '../../Dispense/DispenseDetails/DrugLabelSelection'

const PrintPrescription = props => {
  const { item, dispatch } = props
  const {
    visitFK,
    translationLinkFK,
    id: pharmacyWorkitemId,
    patientProfileFK,
  } = item
  const [showLeafletSelectionPopup, setShowLeafletSelectionPopup] = useState(
    false,
  )
  const [
    showDrugSummaryLabelSelectionPopup,
    setShowDrugSummaryLabelSelectionPopup,
  ] = useState(false)
  const [
    showDrugLabelSelectionPopup,
    setShowDrugLabelSelectionPopup,
  ] = useState(false)
  const [drugLeafletData, setDrugLeafletData] = useState({})
  const [drugSummaryLabelData, setDrugSummaryLabelData] = useState({})
  const [batchInformation, setBatchInformation] = useState({})
  const [anchorEl, setAnchorEl] = React.useState(null)
  const closeLeafletSelectionPopup = () => {
    setShowLeafletSelectionPopup(false)
  }
  const closeDrugSummaryLabelSelectionPopup = () => {
    setShowDrugSummaryLabelSelectionPopup(false)
  }
  const onConfirmPrintLeaflet = () => {
    setShowLeafletSelectionPopup(false)
  }
  const closeDrugLabelSelectionPopup = () => {
    setShowDrugLabelSelectionPopup(false)
  }
  const onConfirmPrintDrugSummaryLabel = () => {
    setShowDrugSummaryLabelSelectionPopup(false)
  }
  const onConfirmPrintDrugLabel = () => {
    setShowDrugLabelSelectionPopup(false)
  }
  const open = Boolean(anchorEl)
  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }
  const printPIL = () => {
    dispatch({
      type: 'pharmacyDetails/queryLeafletDrugList',
      payload: {
        id: visitFK,
      },
    }).then(data => {
      if (data) {
        handleClose()
        setDrugLeafletData(data)
        setShowLeafletSelectionPopup(true)
      }
    })
  }
  const printDrugLabel = () => {
    dispatch({
      type: 'pharmacyDetails/query',
      payload: { id: props.item.id },
    }).then(r => {
      if (r) {
        const { pharmacyOrderItem } = r
        let batchs = []
        pharmacyOrderItem.forEach(x => {
          x.pharmacyOrderItemTransaction.forEach(y => {
            const { batchNo = '', expiryDate = '' } = y
            batchs.push({ batchNo, expiryDate, id: x.id })
          })
        })
        setBatchInformation(batchs)
        setShowDrugLabelSelectionPopup(true)
        handleClose()
      }
    })
  }
  const printDrugSummaryLabel = () => {
    dispatch({
      type: 'pharmacyDetails/queryLeafletDrugList',
      payload: {
        id: visitFK,
      },
    }).then(data => {
      if (!data) {
        return
      }
      handleClose()
      setDrugSummaryLabelData(data)
      setShowDrugSummaryLabelSelectionPopup(true)
    })
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const [showReportViwer, setshowReportViwer] = useState(false)
  const toggleReportViwer = () => {
    setshowReportViwer(!showReportViwer)
  }
  const prescription = () => {
    handleClose()
    toggleReportViwer()
  }
  const blueColor = '#1890f8'
  return (
    <span>
      <Tooltip title='Print Label/Prescription'>
        <Button
          justIcon
          color='transparent'
          style={{
            marginLeft: 10,
          }}
          id='pp-positioned-button'
          aria-haspopup='true'
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          <Print style={{ color: blueColor }} />
        </Button>
      </Tooltip>
      <Menu
        id='pp-positioned-menu'
        aria-labelledby='pp-positioned-button'
        disableAutoFocusItem
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: -30,
        }}
      >
        <MenuItem onClick={printDrugLabel}>Drug Label</MenuItem>
        <MenuItem onClick={printDrugSummaryLabel}>Drug Summary Label</MenuItem>
        {/* <MenuItem onClick={handleClose}>Patient Label</MenuItem> */}
        <MenuItem onClick={printPIL}>Patient Info Leaflet</MenuItem>
        <MenuItem onClick={prescription}>Prescription</MenuItem>
      </Menu>

      <CommonModal
        open={showReportViwer}
        onClose={toggleReportViwer}
        title='Prescription'
        maxWidth='lg'
      >
        <ReportViewer
          showTopDivider={false}
          reportID={84}
          reportParameters={{
            visitFK,
            pharmacyWorkitemId,
            patientProfileFK,
          }}
          defaultScale={1.5}
        />
      </CommonModal>
      <CommonModal
        open={showLeafletSelectionPopup}
        title='Print Patient Info Leaflet'
        onClose={closeLeafletSelectionPopup}
        maxWidth='sm'
        cancelText='Cancel'
        observe='Confirm'
      >
        <DrugLeafletSelection
          {...props}
          rows={drugLeafletData}
          tranlationFK={translationLinkFK}
          visitid={visitFK}
          type='PIL'
          onConfirmPrintLeaflet={onConfirmPrintLeaflet}
        />
      </CommonModal>
      <CommonModal
        open={showDrugSummaryLabelSelectionPopup}
        title='Print Drug Summary Label'
        onClose={closeDrugSummaryLabelSelectionPopup}
        maxWidth='sm'
        cancelText='Cancel'
        observe='Confirm'
      >
        <DrugLeafletSelection
          {...props}
          rows={drugSummaryLabelData}
          tranlationFK={translationLinkFK}
          visitid={visitFK}
          type='drugsummarylabel'
          onConfirmPrintLeaflet={onConfirmPrintDrugSummaryLabel}
        />
      </CommonModal>
      <CommonModal
        open={showDrugLabelSelectionPopup}
        title='Print Drug Labels'
        onClose={closeDrugLabelSelectionPopup}
        maxWidth='sm'
        cancelText='Cancel'
        observe='Confirm'
      >
        <DrugLabelSelection
          {...props}
          batchInformation={batchInformation}
          translationLinkFK={translationLinkFK}
          handleSubmit={onConfirmPrintDrugLabel}
          source='pharmacy'
          visitid={visitFK}
        />
      </CommonModal>
    </span>
  )
}

export default PrintPrescription
