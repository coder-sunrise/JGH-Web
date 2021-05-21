import React, { useState, useRef } from 'react'
import { FastField, withFormik } from 'formik'
import { formatMessage, FormattedMessage } from 'umi'
import { Search, Add, ImportExport, AttachFile } from '@material-ui/icons'
import { withStyles } from '@material-ui/core'
import { standardRowHeight } from 'mui-pro-jss'
import { compose } from 'redux'
import { status } from '@/utils/codes'
import Authorized from '@/utils/Authorized'
import { LoadingWrapper } from '@/components/_medisys'
import { downloadFile } from '@/services/file'
import { convertToBase64 } from '@/utils/utils'
import {
  GridContainer,
  GridItem,
  Select,
  Button,
  TextField,
  CodeSelect,
  ProgressButton,
  notification,
} from '@/components'

const styles = theme => ({
  filterBar: {
    marginBottom: '10px',
  },
  filterBtn: {
    // paddingTop: '13px',
    lineHeight: standardRowHeight,
    textAlign: 'left',
    '& > button': {
      marginRight: theme.spacing.unit,
    },
  },
})

const allowedFiles = '.xlsx'

const FilterBar = ({ classes, dispatch, history, values }) => {
  const [exporting, setExporting] = useState(false)

  const [loadingText, setLoadingText] = useState('')

  const inputEl = useRef(null)

  const onExportClick = async () => {
    setExporting(true)
    setLoadingText('Exporting...')

    dispatch({
      type: 'vaccination/export',
    }).then(result => {
      if (result) {
        downloadFile(result, 'Vaccination.xlsx')
      }

      setExporting(false)
    })
  }

  const onSearchClick = () => {
    const { code, displayValue, supplier, isActive } = values
    dispatch({
      type: 'vaccination/query',
      payload: {
        code,
        displayValue,
        FavouriteSupplierFkNavigation: {
          id: supplier,
        },
        isActive,
      },
    })
  }

  const clearValue = e => {
    e.target.value = null
  }

  const mapToFileDto = async file => {
    const base64 = await convertToBase64(file)
    const originalFile = {
      content: base64,
    }

    return originalFile
  }

  const onImportClick = () => {
    inputEl.current.click()
  }

  const onFileChange = async event => {
    try {
      const { files } = event.target

      const selectedFiles = await Promise.all(
        Object.keys(files).map(key => mapToFileDto(files[key])),
      )

      if (selectedFiles.length > 0) {
        setExporting(true)
        setLoadingText('Importing...')

        dispatch({
          type: 'vaccination/import',
          payload: {
            ...selectedFiles[0],
          },
        }).then(result => {
          if (result && result.byteLength === 0) {
            notification.success({
              message: 'Import success',
            })

            onSearchClick()
          } else if (result && result.byteLength > 0) {
            notification.warning({
              message:
                'File is not valid, please download the validation file and check the issues',
            })
            downloadFile(result, 'Validation.xlsx')
          } else {
            notification.error({
              message: 'Import failed',
            })
          }

          setExporting(false)
        })
      }
    } catch (error) {
      console.log({ error })
    }
  }

  return (
    <div className={classes.filterBar}>
      <GridContainer>
        <GridItem xs={6} md={3}>
          <FastField
            name='code'
            render={args => {
              return (
                <TextField
                  label={formatMessage({
                    id: 'inventory.master.vaccination.code',
                  })}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={6} md={3}>
          <FastField
            name='displayValue'
            render={args => {
              return (
                <TextField
                  label={formatMessage({
                    id: 'inventory.master.vaccination.name',
                  })}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={6} md={3}>
          <FastField
            name='supplier'
            render={args => {
              return (
                <CodeSelect
                  label={formatMessage({
                    id: 'inventory.master.vaccination.supplier',
                  })}
                  code='ctSupplier'
                  labelField='displayValue'
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={6} md={3}>
          <FastField
            name='isActive'
            render={args => {
              return (
                <Select
                  label={formatMessage({
                    id: 'inventory.master.vaccination.status',
                  })}
                  options={status}
                  {...args}
                />
              )
            }}
          />
        </GridItem>

        <GridItem xs={12}>
          <LoadingWrapper linear loading={exporting} text={loadingText}>
            <div className={classes.filterBtn}>
              <ProgressButton
                icon={<Search />}
                variant='contained'
                color='primary'
                onClick={onSearchClick}
              >
                <FormattedMessage id='form.search' />
              </ProgressButton>
              <Authorized authority='inventorymaster.newinventoryitem'>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={() => {
                    dispatch({
                      type: 'vaccinationDetail/updateState',
                      payload: {
                        entity: undefined,
                        currentId: undefined,
                      },
                    })
                    history.push('/inventory/master/vaccination')
                  }}
                >
                  <Add />
                  Add New
                </Button>
              </Authorized>

              <Button color='primary' onClick={onExportClick}>
                <ImportExport />
                Export
              </Button>

              <Authorized authority='inventorymaster.newinventoryitem'>
                <input
                  style={{ display: 'none' }}
                  type='file'
                  accept={allowedFiles}
                  id='importVaccinationFile'
                  ref={inputEl}
                  multiple={false}
                  onChange={onFileChange}
                  onClick={clearValue}
                />

                <Button color='primary' onClick={onImportClick}>
                  <AttachFile />
                  Import
                </Button>
              </Authorized>
              {/* <Button
              variant='contained'
              color='primary'
              onClick={() => {
                // this.props.history.push(
                //   getAppendUrl({
                //     md: 'pt',
                //     cmt: '1',
                //     new: 1,
                //   }),
                // )
              }}
            >
              <GridOn />
              Batch Edit
            </Button> */}
            </div>
          </LoadingWrapper>
        </GridItem>
      </GridContainer>
    </div>
  )
}
export default compose(
  withStyles(styles, { withTheme: true }),
  withFormik({
    mapPropsToValues: () => {},
  }),
  React.memo,
)(FilterBar)
