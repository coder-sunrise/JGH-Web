import React, { Fragment } from 'react'
// common components
import {
  GridContainer,
  GridItem,
  CheckboxGroup,
  EditableTableGrid,
  CommonTableGrid,
  NumberInput,
  ProgressButton,
} from '@/components'
import { connect } from 'dva'

import { getReportContext, getRawData } from '@/services/report'
import { REPORT_ID, LANGUAGES } from '@/utils/constants'
import {
  DrugLabelSelectionColumns,
  DrugLabelSelectionColumnExtensions,
} from '../variables'
import TableData from './TableData'

@connect(({ clinicSettings, patient, dispense }) => ({
  clinicSettings: clinicSettings.settings || clinicSettings.default,
  dispense,
  patient,
}))
class DrugLabelSelection extends React.PureComponent {
  state = {
    prescription: [],
    selectedRows: [],
    selectedLanguage: [],
    confirmEnabled: false,
    languageSelected: false,
  }
  columns = [
    {
      name: 'displayName',
      title: 'Item',
    },
    {
      name: 'no',
      title: 'Copies',
    },
  ]
  columnExtension = [
    {
      disabled: true,
      columnName: 'displayName',
      sortingEnabled: false,
      render: row => {
        return (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {row.displayName}
            </div>
          </div>
        )
      },
    },
    {
      columnName: 'no',
      type: 'number',
      width: 80,
      sortingEnabled: false,
      precision: 0,
      min: 1,
      max: 99,
    },
  ]

  constructor(props) {
    super(props)
    const {
      dispatch,
      batchInformation,
      currentDrugToPrint,
      visitid,
      source = 'dispense',
      translationLinkFK,
    } = props
    dispatch({
      type: 'dispense/getSeparatedDrugInstructions',
      payload: {
        id: visitid,
        includeOpenPrescription: true,
      },
    }).then(data => {
      if (data) {
        // filter when click print from table row.
        if (currentDrugToPrint && currentDrugToPrint.id) {
                                                           data = data.filter(
                                                             t =>
                                                               t.visitInvoiceDrugId ===
                                                               currentDrugToPrint.id,
                                                           )
                                                         }
        // set default language based on patient tranlsation and clinic setting.
        const translationFK =
          translationLinkFK ||
          (this.props.patient &&
            this.props.patient.entity &&
            this.props.patient.entity.translationLinkFK)
        const preferLanguage =
          LANGUAGES[translationFK] ??
          this.props.clinicSettings.primaryPrintoutLanguage
        this.setState({
          prescription: data.map(x => {
            return { ...x, no: 1 }
          }),
          selectedRows:
            source === 'pharmacy'
              ? data.filter(t => t.dispenseByPharmacy).map(item => item.id)
              : data.map(item => item.id),
          selectedLanguage: [preferLanguage],
        })
      }
    })
  }
  componentDidMount = () => {}
  handleSelectionChange = rows => {
    this.setState(() => ({
      selectedRows: rows,
    }))
  }

  tableConfig = {
    FuncProps: {
      pager: false,
      selectable: true,
      selectConfig: {
        showSelectAll: true,
        selectByRowClick: false,
        rowSelectionEnabled: () => true,
      },
    },
  }
  confirmPrint = async () => {
    if (this.state.selectedLanguage.includes('JP')) {
      let printResult = await this.getPrintResult('JP')
      if (!printResult || printResult.length <= 0) return
      await this.props.handlePrint(JSON.stringify(printResult))
    }
    if (this.state.selectedLanguage.includes('EN')) {
      let printResult = await this.getPrintResult('EN')
      if (!printResult || printResult.length <= 0) return
      await this.props.handlePrint(JSON.stringify(printResult))
    }
    this.props.handleSubmit()
  }
  confirmPreview = async previewEventId => {
    if (this.state.selectedLanguage.includes('JP')) {
      let printResult = await this.getPrintResult('JP')
      if (!printResult || printResult.length <= 0) return
      await this.props.handlePreviewReport(
        JSON.stringify(printResult),
        previewEventId,
      )
    }
    if (this.state.selectedLanguage.includes('EN')) {
      let printResult = await this.getPrintResult('EN')
      if (!printResult || printResult.length <= 0) return
      await this.props.handlePreviewReport(
        JSON.stringify(printResult),
        previewEventId,
      )
    }
  }
  getPrintResult = async lan => {
    let drugLabelReportID = REPORT_ID.DRUG_LABEL_80MM_45MM
    let patientLabelReportID = REPORT_ID.PATIENT_LABEL_80MM_45MM
    try {
      let settings = JSON.parse(localStorage.getItem('clinicSettings'))
      if (settings && settings.labelPrinterSize === '8.9cmx3.6cm') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_89MM_36MM
        patientLabelReportID = REPORT_ID.PATIENT_LABEL_89MM_36MM
      } else if (settings && settings.labelPrinterSize === '7.6cmx3.8cm') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_76MM_38MM
        patientLabelReportID = REPORT_ID.PATIENT_LABEL_76MM_38MM
      } else if (settings && settings.labelPrinterSize === '8.0cmx4.5cm_V2') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_80MM_45MM_V2
      }

      const {
        dispense,
        values = {},
        currentDrugToPrint,
        visitid,
        batchInformation,
      } = this.props
      const { packageItem, dispenseItems } = values
      const data = await getRawData(drugLabelReportID, {
        selectedDrugs: JSON.stringify(
          this.state.prescription
            .filter(
              t => this.state.selectedRows.filter(x => x === t.id).length > 0,
            )
            .map(t => {
              return {
                id: t.id,
                vidId: t.visitInvoiceDrugId,
                pinfo: t.pageInfo,
                insId: _.join(t.instructionId, ','),
              }
            }),
        ),
        language: lan,
        visitId: visitid || dispense.visitID,
      })
      let finalDrugLabelDetails = []
      data.DrugLabelDetails.forEach(t => {
        let dispenseItemss = []
        if (dispenseItems) {
          dispenseItemss = dispenseItems.filter(
            x => x.invoiceItemFK === t.invoiceItemId,
          )
        }
        if (batchInformation) {
          dispenseItemss = batchInformation.filter(
            xxx => xxx.id === t.invoiceItemId,
          )
        }
        t.instruction = t.instruction.replace('\n ', '\n').replace('\n ', '')
        var indicationArray = (t.indication || '').split('\n')
        t.firstLine = indicationArray.length > 0 ? indicationArray[0] : ' '
        t.secondLine = indicationArray.length > 1 ? indicationArray[1] : ' '
        t.thirdLine =
          indicationArray.length > 2
            ? indicationArray[2] +
              ' ' +
              (t.isDrugMixture && indicationArray.length > 3 ? ', ' : '') +
              // currently will append all the precaution into last line if it's AND
              (t.isDrugMixture ? _.slice(indicationArray, 3).join(', ') : '')
            : ' '
        // If it's drugmixture, then just duplicate by copies.
        if (t.isDrugMixture) {
          for (
            let j = 0;
            j <
            this.state.prescription.find(
              x =>
                x.id === t.index &&
                this.state.selectedRows.filter(tt => tt == x.id).length > 0,
            ).no;
            j++
          ) {
            finalDrugLabelDetails.push(t)
          }
        }
        // If it's normal items, then need to based on Batch and Copies to duplicate.
        else {
          for (
            let j = 0;
            j <
            this.state.prescription.find(
              x =>
                x.id === t.index &&
                this.state.selectedRows.filter(tt => tt == x.id).length > 0,
            ).no;
            j++
          ) {
            if (dispenseItemss && dispenseItemss.length > 0) {
              for (let i = 0; i < dispenseItemss.length; i++) {
                let xx = { ...t }
                xx.ExpiryDate = dispenseItemss[i].expiryDate
                xx.BatchNo = dispenseItemss[i].batchNo
                finalDrugLabelDetails.push(xx)
              }
            } else {
              finalDrugLabelDetails.push({ ...t })
            }
          }
        }
      })
      data.DrugLabelDetails = finalDrugLabelDetails
      const payload = [
        {
          ReportId: drugLabelReportID,
          ReportData: JSON.stringify({
            ...data,
          }),
        },
      ]
      return payload
    } catch (error) {
      console.log({ error })
    }
    return null
  }

  handlePrintOutLanguageChanged = lang => {
    this.setState({ selectedLanguage: lang })
  }

  handleCommitChanges = ({ rows }) => {
    this.setState({
      prescription: [...rows],
    })
  }
  render() {
    const {
      footer,
      handleSubmit,
      invoiceItems,
      selectedDrugs,
      dispenseItems = [],
      packageItem,
      clinicSettings,
      visitid,
      ...restProps
    } = this.props
    const {
      primaryPrintoutLanguage = 'EN',
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const showDrugWarning = this.state.selectedRows.length === 0
    const showLanguageWarning = this.state.selectedLanguage.length == 0
    const printLabelDisabled = showDrugWarning || showLanguageWarning
    return (
      <div>
        <GridContainer>
          <GridItem md={12}>
            {this.state.prescription && this.state.prescription.length > 0 && (
              <EditableTableGrid
                size='sm'
                forceRender
                columns={this.columns}
                columnExtensions={this.columnExtension}
                rows={this.state.prescription}
                {...this.tableConfig}
                selection={this.state.selectedRows}
                onSelectionChange={this.handleSelectionChange}
                EditingProps={{
                  showAddCommand: false,
                  showDeleteCommand: false,
                  onCommitChanges: this.handleCommitChanges,
                  showCommandColumn: false,
                }}
              />
            )}
          </GridItem>
          <GridItem>
            <Fragment>
              {secondaryPrintoutLanguage && (
                <div style={{ display: 'inline-block' }}>
                  <span>Print In: </span>
                  <div style={{ width: 150, display: 'inline-block' }}>
                    <CheckboxGroup
                      displayInlineBlock={true}
                      value={this.state.selectedLanguage}
                      options={[
                        { value: 'EN', label: 'EN' },
                        { value: 'JP', label: 'JP' },
                      ]}
                      onChange={v => {
                        this.handlePrintOutLanguageChanged(v.target.value)
                      }}
                    />
                  </div>
                </div>
              )}
              {showDrugWarning && (
                <div style={{ color: 'red' }}>
                  * Please select at least one drug to print.
                </div>
              )}
              {showLanguageWarning && (
                <div style={{ color: 'red' }}>
                  * Please select at least one language to print.
                </div>
              )}
            </Fragment>
          </GridItem>
        </GridContainer>
        {footer &&
          footer({
            cancelProps: {},
            confirmProps: {
              disabled: printLabelDisabled,
            },
            onConfirm: this.confirmPrint,
            extraButtons: (
              <ProgressButton
                color='info'
                icon={null}
                type='submit'
                disabled={printLabelDisabled}
                onClick={() => {
                  this.confirmPreview(Date.now())
                }}
              >
                Preview
              </ProgressButton>
            ),
            confirmBtnText: 'Print',
          })}
      </div>
    )
  }
}
export default DrugLabelSelection
