import React, { Fragment, PureComponent } from 'react'
import Edit from '@material-ui/icons/Edit'
import { status } from '@/utils/codes'
import { CommonTableGrid, Button, Tooltip, Popconfirm } from '@/components'
import Delete from '@material-ui/icons/Delete'

class Grid extends PureComponent {
  editRow = (row, e) => {
    const { dispatch, settingIndividualComment } = this.props
    const { list } = settingIndividualComment
    dispatch({
      type: 'settingIndividualComment/updateState',
      payload: {
        showModal: true,
        entity: list.find(o => o.id === row.id),
      },
    })
  }
  confirmDelete = id => {
    const { dispatch } = this.props
    dispatch({
      type: 'settingIndividualComment/delete',
      payload: { id },
    }).then(() => {
      dispatch({
        type: 'settingIndividualComment/query',
        payload: {},
      })
    })
  }

  deleteIndividualComment = (row, e) => {
    this.confirmDelete(row.id)
  }

  render() {
    const { height, clinicSettings } = this.props
    const {
      primaryPrintoutLanguage = 'EN',
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const isUseSecondLanguage = secondaryPrintoutLanguage !== ''
    let columns = [
      { name: 'code', title: 'Code' },
      {
        name: 'displayValue',
        title: `Display Value${
          isUseSecondLanguage ? ` (${primaryPrintoutLanguage})` : ''
        }`,
      },
      {
        name: 'translatedDisplayValue',
        title: `Display Value (${secondaryPrintoutLanguage})`,
      },
      { name: 'examinationItem', title: 'Examination' },
      { name: 'groupNo', title: 'Comment Group' },
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
        type='settingIndividualComment'
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
            sortingEnabled: false,
          },
          {
            columnName: 'examinationItem',
            sortingEnabled: false,
            width: 200,
          },
          {
            columnName: 'groupNo',
            width: 150,
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
                  <Tooltip title='Edit Individual Comment' placement='bottom'>
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
                        this.deleteIndividualComment(row)
                      }, 1)
                    }}
                  >
                    <Tooltip title='Delete Individual Comment'>
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
