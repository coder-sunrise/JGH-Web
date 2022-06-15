import React, { Fragment, PureComponent } from 'react'
import Edit from '@material-ui/icons/Edit'
import { status } from '@/utils/codes'
import { CommonTableGrid, Button, Tooltip, Popconfirm } from '@/components'
import Delete from '@material-ui/icons/Delete'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

class Grid extends PureComponent {
  editRow = (row, e) => {
    const { dispatch, settingSummaryComment } = this.props
    const { list } = settingSummaryComment
    dispatch({
      type: 'settingSummaryComment/updateState',
      payload: {
        showModal: true,
        entity: list.find(o => o.id === row.id),
      },
    })
  }
  confirmDelete = id => {
    const { dispatch } = this.props
    dispatch({
      type: 'settingSummaryComment/delete',
      payload: { id },
    }).then(() => {
      dispatch({
        type: 'settingSummaryComment/query',
        payload: {},
      })
    })
  }

  deleteSummaryComment = (row, e) => {
    this.confirmDelete(row.id)
  }

  render() {
    const { height, clinicSettings } = this.props
    const {
      primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const isUseSecondLanguage =
      primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE ||
      secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE
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
        title: `Display Value (${SYSTEM_LANGUAGE.SECOUNDLANGUAGE})`,
      },
      { name: 'summaryCommentCategory', title: 'Category' },
      { name: 'sortOrder', title: 'Sort Order' },
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
        type='settingSummaryComment'
        onRowDoubleClick={this.editRow}
        TableProps={{
          height,
        }}
        columns={columns}
        columnExtensions={[
          {
            columnName: 'translatedDisplayValue',
            sortingEnabled: false,
          },
          {
            columnName: 'displayValue',
          },
          {
            columnName: 'summaryCommentCategory',
            width: 200,
            sortBy: 'SummaryCommentCategoryFKNavigation.DisplayValue',
          },
          {
            columnName: 'code',
            width: 200,
          },
          {
            columnName: 'sortOrder',
            width: 120,
            render: row => {
              return <p>{row.sortOrder === undefined ? '-' : row.sortOrder}</p>
            },
          },
          {
            columnName: 'action',
            sortingEnabled: false,
            align: 'center',
            width: 100,
            render: row => {
              return (
                <Fragment>
                  <Tooltip title='Edit Summary Comment' placement='bottom'>
                    <Button
                      size='sm'
                      onClick={() => {
                        this.editRow(row)
                      }}
                      justIcon
                      color='primary'
                      style={{ marginRight: 8 }}
                    >
                      <Edit />
                    </Button>
                  </Tooltip>
                  <Popconfirm
                    title='Are you sure?'
                    onConfirm={() => {
                      setTimeout(() => {
                        this.deleteSummaryComment(row)
                      }, 1)
                    }}
                  >
                    <Tooltip title='Delete Summary Comment'>
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
