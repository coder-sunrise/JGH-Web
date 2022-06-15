import React, { Fragment, PureComponent } from 'react'
import { CommonTableGrid, Button, Tooltip, Popconfirm } from '@/components'
import { status } from '@/utils/codes'
import Edit from '@material-ui/icons/Edit'
import Delete from '@material-ui/icons/Delete'
import { Tag } from 'antd'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

class Grid extends PureComponent {
  editRow = (row, e) => {
    const { dispatch, settingMedicineTrivia } = this.props
    const { list } = settingMedicineTrivia
    dispatch({
      type: 'settingMedicineTrivia/updateState',
      payload: {
        showModal: true,
        entity: list.find(o => o.id === row.id),
      },
    })
  }

  confirmDelete = id => {
    const { dispatch } = this.props
    dispatch({
      type: 'settingMedicineTrivia/delete',
      payload: { id },
    }).then(() => {
      dispatch({
        type: 'settingMedicineTrivia/query',
        payload: {
          sorting: [
            { columnName: 'isDefault', direction: 'desc' },
            { columnName: 'updateDate', direction: 'desc' },
          ],
        },
      })
    })
  }

  deleteTrivia = (row, e) => {
    this.confirmDelete(row.id)
  }

  FuncConfig = {
    sort: true,
    sortConfig: {
      defaultSorting: [
        { columnName: 'isDefault', direction: 'desc' },
        { columnName: 'updateDate', direction: 'desc' },
      ],
    },
  }
  render() {
    const { height, clinicSettings } = this.props
    const {
      primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
      secondaryPrintoutLanguage = '',
    } = clinicSettings

    const isUseSecondLanguage =
      primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
      secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
    let columns = [
      { name: 'code', title: 'Code' },
      {
        name: 'displayValue',
        title: `Display Value${
          isUseSecondLanguage ? ` (${SYSTEM_LANGUAGE.PRIMARYLANGUAGE})` : ''
        }`,
      },
      {
        name: 'translatedDisplayValue',
        title: `Display Value (${SYSTEM_LANGUAGE.SECONDLANGUAGE})`,
      },
      {
        name: 'action',
        title: 'Action',
      },
    ]

    if (!isUseSecondLanguage) {
      columns = columns.filter(c => c.name !== 'translatedDisplayValue')
    }
    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        forceRender
        type='settingMedicineTrivia'
        onRowDoubleClick={this.editRow}
        TableProps={{
          height,
        }}
        FuncProps={this.FuncConfig}
        columns={columns}
        columnExtensions={[
          {
            columnName: 'translatedDisplayValue',
            sortingEnabled: false,
          },
          {
            columnName: 'code',
            width: 300,
            sortingEnabled: true,
            render: row => {
              let width = row.isDefault ? 228 : 290
              return (
                <Tooltip title={row.code} placement='bottom'>
                  <div style={{ position: 'relative', top: '3px' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        width: width,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.code}
                    </div>
                    {row.isDefault ? (
                      <span style={{ position: 'relative', top: '-5px' }}>
                        <Tag color='#008000'>Current</Tag>
                      </span>
                    ) : (
                      <span></span>
                    )}
                  </div>
                </Tooltip>
              )
            },
          },
          {
            columnName: 'action',
            sortingEnabled: false,
            align: 'center',
            render: row => {
              return (
                <Fragment>
                  <Tooltip title='Edit Medicine Trivia' placement='bottom'>
                    <Button
                      size='sm'
                      onClick={() => {
                        this.editRow(row)
                      }}
                      justIcon
                      color='primary'
                    >
                      <Edit />
                    </Button>
                  </Tooltip>

                  <Popconfirm
                    title='Are you sure?'
                    onConfirm={() => {
                      setTimeout(() => {
                        this.deleteTrivia(row)
                      }, 1)
                    }}
                  >
                    <Tooltip title='Delete Medicine Trivia'>
                      <Button
                        className='noPadding'
                        color='danger'
                        size='sm'
                        id={row.id}
                        justIcon
                        rounded
                      >
                        <Delete />
                      </Button>
                    </Tooltip>
                  </Popconfirm>
                </Fragment>
              )
            },
          },
        ]}
      />
    )
  }
}

export default Grid
