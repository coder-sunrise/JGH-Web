import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { connect } from 'dva'
import moment from 'moment'
import { dateFormatLong, Checkbox } from '@/components'
import { Table } from 'antd'
import { defaultData, defaultColumns } from './utils'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'
import { TESTTYPES, GENDER } from '@/utils/constants'
import TestResultLabel from './TestResultLabel'
import tablestyles from './index.less'

const styles = theme => ({})
@connect(({ clinicSettings }) => ({ clinicSettings }))
class BasicData extends Component {
  constructor(props) {
    super(props)
    this.visitTypeSetting = JSON.parse(
      props.clinicSettings.settings.visitTypeSetting,
    )
    const { genderFK, defaultSelectMedicalCheckup = false } = props
    this.state = {
      data: defaultData,
      columns: defaultColumns(genderFK),
      currentPage: 0,
      total: 0,
      isOnlySearchMC: defaultSelectMedicalCheckup,
      loadedData: [],
    }
  }

  componentDidMount() {
    this.searchData()
  }

  searchData = () => {
    const { genderFK } = this.props
    this.setState(
      {
        data: defaultData,
        columns: defaultColumns(genderFK),
        currentPage: 0,
        total: 0,
        loadedData: [],
      },
      () => {
        this.loadData()
      },
    )
  }

  loadData = () => {
    const { dispatch, patientProfileFK } = this.props
    dispatch({
      type: 'patientResults/queryBasicDataList',
      payload: {
        sort: [
          {
            sortby: 'visitDate',
            order: 'desc',
          },
        ],
        patientProfileFK,
        current: this.state.currentPage + 1,
      },
    }).then(response => {
      if (response && response.status === '200') {
        this.setState(
          {
            currentPage: this.state.currentPage + 1,
            total: response.data.totalRecords,
            loadedData: [...this.state.loadedData, ...response.data.data],
          },
          this.updateData,
        )
      }
    })
  }

  hasAnyValue = (key, data) => {
    const rows = data.find(d => d.testCode === key)
    if (
      !Object.keys(rows).find(
        key => key.includes('valueColumn') && hasValue(rows[key]),
      )
    ) {
      return false
    }
    return true
  }

  updateData = () => {
    const { genderFK } = this.props
    const showData = this.state.loadedData.filter(
      c => !this.state.isOnlySearchMC || c.visitPurposeFK === 4,
    )

    let newData = defaultData
      .filter(
        d =>
          genderFK !== GENDER.MALE ||
          [TESTTYPES.PREGNANCY, TESTTYPES.MENSUS].indexOf(d.testCode) < 0,
      )
      .map(row => {
        let insertVisit = {}
        let index = 0
        showData.forEach(data => {
          let value
          if (!row.isGroup && row.tableName && row.fieldName) {
            const entity = data[row.tableName]
            if (entity) {
              if (
                row.testCode === TESTTYPES.WAIST &&
                (entity.isChild || entity.isPregnancy)
              ) {
                value = 'NA'
              } else {
                value = entity[row.fieldName]
              }
            }
          }
          insertVisit = {
            ...insertVisit,
            [`valueColumn${index + 1}`]: value,
          }
          if (row.testCode === TESTTYPES.COLORVISIONTEST) {
            const entity = data[row.tableName]
            insertVisit = {
              ...insertVisit,
              [`colorVisionRemarksColumn${index + 1}`]: entity?.remarks,
            }
          }
          index = index + 1
        })

        return { ...row, ...insertVisit }
      })

    if (!this.hasAnyValue(TESTTYPES.ROHRER, newData)) {
      newData = newData.filter(d => d.testCode !== TESTTYPES.ROHRER)
    }

    if (!this.hasAnyValue(TESTTYPES.KAUP, newData)) {
      newData = newData.filter(d => d.testCode !== TESTTYPES.KAUP)
    }

    let newColumns = defaultColumns(genderFK).filter(
      c => c.dataIndex !== 'action',
    )
    showData.forEach((data, i) => {
      const visitPurpose = this.visitTypeSetting.find(
        x => x.id === data.visitPurposeFK,
      )
      let newColumn = {
        dataIndex: `valueColumn${i + 1}`,
        align: 'right',
        title: (
          <div
            style={{
              padding: '4px',
            }}
          >
            <div style={{ height: 16 }}>
              {moment(data.visitDate).format(dateFormatLong)}
            </div>
            <div style={{ height: 16 }}>({visitPurpose.code})</div>
          </div>
        ),
        width: 100,
        render: (text, row) => {
          let tooltip
          if (row.testCode === TESTTYPES.COLORVISIONTEST) {
            tooltip = row[`colorVisionRemarksColumn${i + 1}`]
          }
          return (
            <div
              style={{
                padding: '2px 4px',
              }}
            >
              <TestResultLabel
                value={row[`valueColumn${i + 1}`]}
                tooltip={tooltip}
                format={row.format}
                valueType={row.valueType}
                testCode={row.testCode}
                genderFK={genderFK}
              />
            </div>
          )
        },
      }
      if (i === 0) {
        newColumn = {
          ...newColumn,
          onCell: row => {
            if (row.isGroup)
              return {
                colSpan:
                  Object.keys(row).filter(name => name.includes('valueColumn'))
                    .length + 1,
                style: { backgroundColor: '#daecf5' },
              }
            return { colSpan: 1, style: { backgroundColor: '#daecf5' } }
          },
        }
      }
      newColumns.push(newColumn)
    })
    newColumns = [
      ...newColumns,
      defaultColumns(genderFK).find(c => c.dataIndex === 'action'),
    ]

    this.setState({
      data: newData,
      columns: newColumns,
    })
  }

  render() {
    const { height, clinicSettings } = this.props
    const { total, currentPage } = this.state
    const showLoadMore = currentPage * 5 < total
    return (
      <div>
        <div style={{ position: 'relative', height: 40 }}>
          {clinicSettings.settings.isEnableMedicalCheckupModule && (
            <Checkbox
              checked={this.state.isOnlySearchMC}
              label='Display Medical Check Up Only'
              onChange={e => {
                this.setState(
                  { isOnlySearchMC: e.target.value },
                  this.updateData,
                )
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 8,
            }}
          >
            {showLoadMore && (
              <a
                style={{ textDecoration: 'underline', fontStyle: 'italic' }}
                onClick={this.loadData}
              >
                Load More
              </a>
            )}
          </div>
        </div>
        <Table
          size='small'
          bordered
          pagination={false}
          columns={this.state.columns}
          dataSource={this.state.data}
          className={tablestyles.table}
          scroll={{ y: height - 80 }}
        />
      </div>
    )
  }
}
export default withStyles(styles, { withTheme: true })(BasicData)
