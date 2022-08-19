import React, { PureComponent, Fragment } from 'react'
import * as Yup from 'yup'
import _ from 'lodash'
import { getRawData } from '@/services/report'
import { connect } from 'dva'
import { REPORT_ID, LANGUAGES } from '@/utils/constants'
// common components
import { withStyles } from '@material-ui/core'
import {
  GridContainer,
  GridItem,
  NumberInput,
  Checkbox,
  EditableTableGrid,
  notification,
  CheckboxGroup,
  CommonTableGrid,
} from '@/components'
import { Alert } from 'antd'
import { ThreeSixtySharp } from '@material-ui/icons'
import { getFixedWidthBreakLineChars } from '@/utils/utils'

@connect(({ clinicSettings, patient }) => ({
  clinicSettings: clinicSettings.settings || clinicSettings.default,
  patient: patient.entity,
}))
class DrugLeafletSelection extends PureComponent {
  state = {
    data: [],
    selectedRows: [],
    printlanguage: [],
    confirmEnabled: false,
    languageSelected: false,
  }

  columns = [
    {
      name: 'displayName',
      title: 'Item',
    },
  ]
  colExtensions = [
    {
      columnName: 'displayName',
    },
  ]

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
  componentWillMount = () => {
    let {
      visitid,
      dispatch,
      rows,
      tranlationFK,
      patient,
      clinicSettings,
      type,
    } = this.props
    const preferLanguage =
      LANGUAGES[tranlationFK || (patient && patient.translationLinkFK)] ??
      clinicSettings.primaryPrintoutLanguage
    this.setState({ printlanguage: [preferLanguage] })
    if (type === 'PIL') {
      this.setState({
        selectedRows: rows
          .filter(t => t.displayInLeaflet)
          .map(x => {
            return x.id
          }),
      })
    } else {
      this.setState({
        selectedRows: rows
          .filter(t => t.dispenseByPharmacy)
          .map(x => {
            return x.id
          }),
      })
    }
  }
  constructor(props) {
    super(props)
  }

  handleSelectionChange = rows => {
    this.setState(() => ({
      selectedRows: rows,
    }))
  }

  handleCommitChanges = ({ rows }) => {
    this.setState({
      data: [...rows],
    })
  }
  printLeaflet = async (printData = {}) => {
    const { visitid } = this.props
    const visitinvoicedrugids = _.join(
      printData.map(x => {
        return x.visitInvoiceDrugId
      }),
    )
    const instructionIds = _.join(
      printData
        // skip drug mixture
        .filter(xx => xx.instructionId && xx.instructionId.length > 0)
        .map(x => {
          return _.join(x.instructionId, ',')
        }),
    )
    if (this.state.printlanguage.includes('EN')) {
      await this.doPrintLeaflet(
        visitid,
        visitinvoicedrugids,
        instructionIds,
        'EN',
      )
    }
    if (this.state.printlanguage.includes('JP')) {
      await this.doPrintLeaflet(
        visitid,
        visitinvoicedrugids,
        instructionIds,
        'JP',
      )
    }
    this.props.onConfirmPrintLeaflet()
  }
  doPrintLeaflet = async (
    visitid,
    visitinvoicedrugids,
    instructionIds,
    lan,
  ) => {
    const data = await getRawData(REPORT_ID.PATIENT_INFO_LEAFLET, {
      visitinvoicedrugids,
      instructionIds,
      language: lan,
      visitId: visitid,
    })
    if (!data || !data.DrugDetailsList) {
      return
    }
    // ingredient in leaflet will max to 2 lines and end with ', etc...' if more than 2 lines;
    data.DrugDetailsList.forEach(t => {
      if (t.ingredient) {
        t.ingredient = `(${t.ingredient})`
      }
      if (
        lan === 'JP' &&
        t.precautionsAndSideEffect &&
        t.precautionsAndSideEffect != '\n'
      ) {
        t.precautionsAndSideEffect = _.join(
          t.precautionsAndSideEffect.split('\n').map(precaution => {
            return getFixedWidthBreakLineChars(
              precaution,
              {
                height: 0,
                display: 'inline-block',
                fontFamily: 'MS PGothic',
                fontSize: '13px',
              },
              234,
              16,
            )
          }),
          '\n',
        )
      }
    })
    const payload = [
      {
        ReportId: REPORT_ID.PATIENT_INFO_LEAFLET,
        ReportData: JSON.stringify({
          ...data,
        }),
      },
    ]
    await this.props.handlePrint(JSON.stringify(payload))
  }

  printDrugSummaryLabel = async (printData = {}) => {
    const { visitid } = this.props
    const visitinvoicedrugids = _.join(
      printData.map(x => {
        return x.visitInvoiceDrugId
      }),
    )
    const instructionIds = _.join(
      printData
        // skip drug mixture
        .filter(xx => xx.instructionId && xx.instructionId.length > 0)
        .map(x => {
          return _.join(x.instructionId, ',')
        }),
    )
    if (this.state.printlanguage.includes('EN')) {
      await this.doPrintDrugSummaryLabel(
        visitid,
        visitinvoicedrugids,
        instructionIds,
        'EN',
      )
    }
    if (this.state.printlanguage.includes('JP')) {
      await this.doPrintDrugSummaryLabel(
        visitid,
        visitinvoicedrugids,
        instructionIds,
        'JP',
      )
    }
    this.props.onConfirmPrintLeaflet()
  }
  doPrintDrugSummaryLabel = async (
    visitid,
    visitinvoicedrugids,
    instructionIds,
    lan,
  ) => {
    const data = await getRawData(REPORT_ID.DRUG_SUMMARY_LABEL_80MM_45MM, {
      visitinvoicedrugids,
      instructionIds,
      language: lan,
      visitId: visitid,
    })
    if (!data || !data.DrugDetailsList) {
      notification.error({
        message: `Get drug summary label data failed.`,
      })
      return
    }
    data.DrugDetailsList.forEach(t => {
      if (t.isDrugMixture) {
        const instructions = (t.instruction || '').split('\n')
        // if it's drug mixture then first line will not show(occupied by drug mixture's drug name)
        t.FirstLine = ''
        t.SecondLine =
          (t.ingredient || '').length > 54
            ? `(${t.ingredient.substr(0, 53)}…)`
            : t.ingredient && t.ingredient.length > 0
            ? `(${t.ingredient})`
            : ''
        // If language is EN, instruction need to auto breakline and show in 2 lines
        // If JP, then need to separate to 2 lines. last line will include the last remaining 2 step dose.
        if (lan === 'JP') {
          t.ThirdLine = instructions.length > 0 ? instructions[0] : ''
          t.FourthLine = instructions.length > 1 ? instructions[1] : ''
          if (instructions.length > 2) {
            t.FourthLine = `${t.FourthLine} ${instructions[2]}`
          }
        } else {
          t.ThirdLine = t.instruction
        }
      } else {
        const instructions = (t.instruction || '').split('\n')
        t.FirstLine =
          (t.ingredient || '').length > 54
            ? `(${t.ingredient.substr(0, 53)}…)`
            : t.ingredient && t.ingredient.length > 0
            ? `(${t.ingredient})`
            : ''
        t.SecondLine = t.indication
        // If language is EN, instruction need to auto breakline and show in 2 lines
        // If JP, then need to separate to 2 lines. last line will include the last remaining 2 step dose.
        if (lan === 'JP') {
          t.ThirdLine = instructions.length > 0 ? instructions[0] : ''
          t.FourthLine = instructions.length > 1 ? instructions[1] : ''
          if (instructions.length > 2) {
            t.FourthLine = `${t.FourthLine} ${instructions[2]}`
          }
        } else {
          t.ThirdLine = t.instruction
        }
      }
    })
    const payload = [
      {
        ReportId: REPORT_ID.DRUG_SUMMARY_LABEL_80MM_45MM,
        ReportData: JSON.stringify({
          ...data,
        }),
      },
    ]
    await this.props.handlePrint(JSON.stringify(payload))
  }
  render() {
    const {
      onConfirmPrintLeaflet,
      footer,
      rows,
      classes,
      handlePrint,
      clinicSettings,
      showInvoiceAmountNegativeWarning,
    } = this.props
    const {
      primaryPrintoutLanguage = 'EN',
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const showDrugWarning =
      this.props.rows.filter(item => this.state.selectedRows.includes(item.id))
        .length == 0
    const showLanguageWarning =
      secondaryPrintoutLanguage != '' && this.state.printlanguage.length == 0
    return (
      <div>
        <GridContainer>
          <GridItem md={12}>
            {this.state.data && (
              <div className={classes.tableContainer}>
                <CommonTableGrid
                  size='sm'
                  columns={this.columns}
                  columnExtensions={this.colExtensions}
                  rows={rows}
                  {...this.tableConfig}
                  selection={this.state.selectedRows}
                  onSelectionChange={this.handleSelectionChange}
                />
              </div>
            )}
          </GridItem>
          <GridItem>
            <Fragment>
              {secondaryPrintoutLanguage !== '' && (
                <div style={{ display: 'inline-block' }}>
                  <span>Print In: </span>
                  <div style={{ width: 150, display: 'inline-block' }}>
                    <CheckboxGroup
                      displayInlineBlock={true}
                      value={this.state.printlanguage}
                      options={[
                        { value: 'EN', label: 'EN' },
                        { value: 'JP', label: 'JP' },
                      ]}
                      onChange={v => {
                        this.setState({
                          printlanguage: v.target.value,
                        })
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
        {footer({
          onConfirm: () => {
            const { selectedRows } = this.state
            const selectedData = rows.filter(item =>
              selectedRows.includes(item.id),
            )
            if (this.props.type === 'PIL') {
              this.printLeaflet(selectedData)
            } else if (this.props.type === 'drugsummarylabel') {
              this.printDrugSummaryLabel(selectedData)
            }
          },
          confirmBtnText: 'Confirm',
          confirmProps: { disabled: showDrugWarning || showLanguageWarning },
        })}
      </div>
    )
  }
}

export default DrugLeafletSelection
