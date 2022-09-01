import React, { PureComponent } from 'react'
import Yup from '@/utils/yup'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  RichEditor,
  Field,
  SizeContainer,
  CodeSelect,
  Checkbox,
  Tooltip,
  CommonModal,
  DocumentEditor,
  Popover,
} from '@/components'
import { tagList } from '@/utils/codes'
import {
  DOCUMENT_CATEGORY,
  DOCUMENTCATEGORY_DOCUMENTTYPE,
} from '@/utils/constants'
import { InfoTwoTone } from '@material-ui/icons'
import { withStyles } from '@material-ui/core'

const styles = theme => ({})

@withFormikExtend({
  mapPropsToValues: ({ settingDocumentTemplate }) =>
    settingDocumentTemplate.entity || {
      ...settingDocumentTemplate.default,
      documentCategoryFK: settingDocumentTemplate.documentCategoryFK,
      templateContent: '',
    },
  validationSchema: Yup.object().shape({
    documentCategoryFK: Yup.string().required(),
    documentTemplateTypeFK: Yup.string().required(),
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
    templateContent: Yup.string().when('documentCategoryFK', {
      is: val => val == DOCUMENT_CATEGORY.FORM,
      then: Yup.string().nullable(),
      otherwise: Yup.string().required(),
    }),
    effectiveDates: Yup.array()
      .of(Yup.date())
      .min(2)
      .required(),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
    const { dispatch, onConfirm } = props
    const { isDefaultTemplate, id } = restValues
    let message
    if (isDefaultTemplate) {
      message = 'Default template saved successfully.'
    } else if (id) {
      message = 'Template saved successfully.'
    } else {
      message = 'Template created successfully.'
    }
    dispatch({
      type: 'settingDocumentTemplate/upsert',
      payload: {
        ...restValues,
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
        cfg: { message },
      },
    }).then(r => {
      if (r) {
        resetForm()
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingDocumentTemplate/query',
        })
      }
    })
  },
  displayName: 'DocumentTemplateDetail',
})
class Detail extends PureComponent {
  state = { isShowSaveDefaultTemplate: false }

  FormFieldTips = () => {
    const formFieldTips_Subject = 'Guidelines to use Forms Fields'
    const formFieldTips_Tooltip =
      "i.\tPatient's Name: PatientName\n" +
      "ii.\tPatient's Gender: PatientGender\n" +
      'iii.\tBoolean for Female: GenderFemale\n' +
      'iv.\tBoolean for Male: GenderMale\n' +
      "v.\tPatient's DOB: PatientDOB\n" +
      "vi.\tPatient's Age: PatientAge\n" +
      "vii.\tPatient's Reference Number: PatientRefNo\n" +
      "viii.\tPatient's Account Number: PatientAccNo\n" +
      "ix.\tDoctor's Name : DoctorName\n" +
      "x.\tToday's Date: TodayDate\n" +
      '\nif you would like to enter twice the same instance, please\n' +
      'key in "<InstanceName>_<Number>".The number must be unique\n' +
      'throughout a form.\n' +
      'eg: for patient name,please enter "PatientName_2"'
    const formFieldTips_Content = (
      <span>
        In order to add autofill feature, you must input the exact same instance
        into the Name column. For example: To auto-populate patient's name, you
        need to key in PatientName into the Name column in Forms Fields -&gt;
        Text Form -&gt; Field Settings Mouse over the
        <span>
          <InfoTwoTone color='primary' style={{ verticalAlign: 'text-top' }} />
        </span>
        icon for more autofill instances.
      </span>
    )

    return (
      <div style={{ marginLeft: 10 }}>
        <p>
          <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
            {formFieldTips_Subject}
          </span>
          <Popover
            icon={null}
            placement='topLeft'
            trigger='hover'
            content={
              <span style={{ whiteSpace: 'pre' }}>{formFieldTips_Tooltip}</span>
            }
          >
            <InfoTwoTone
              color='primary'
              style={{ verticalAlign: 'text-top' }}
            />
          </Popover>
        </p>
        <p>{formFieldTips_Content}</p>
      </div>
    )
  }

  handelSaveDefaultTemplate = () => {
    this.setState(preState => {
      return { isShowSaveDefaultTemplate: !preState.isShowSaveDefaultTemplate }
    })
  }

  handelConfirm = () => {
    const { values, handleSubmit } = this.props
    const { isDefaultTemplate } = values
    if (isDefaultTemplate) {
      this.handelSaveDefaultTemplate()
    } else {
      handleSubmit()
    }
  }

  contentChange = () => {
    this.props.setFieldValue(
      'templateContent',
      this.edContainer.documentEditor.serialize(),
    )
  }

  componentCreated = e => {
    if (!this.edContainer?.document) {
      this.edContainer.documentEditor.openBlank()
      this.contentChange()
    }
  }

  render() {
    const { props } = this
    const {
      theme,
      footer,
      settingDocumentTemplate,
      setFieldValue,
      height,
      values,
    } = props
    const { documentTemplateTypeFK, displayValue, documentCategoryFK } = values
    return (
      <SizeContainer size='sm'>
        <div style={{ margin: theme.spacing(1) }}>
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='documentCategoryFK'
                render={args => {
                  return (
                    <CodeSelect
                      disabled
                      code='LTDocumentCategory'
                      label='Document Category'
                      onChange={() => {
                        setFieldValue('documentTemplateTypeFK', undefined)
                      }}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                shouldUpdate={() => true}
                name='documentTemplateTypeFK'
                render={args => {
                  const filterTemplateTypes =
                    DOCUMENTCATEGORY_DOCUMENTTYPE.find(
                      y => y.documentCategoryFK === values.documentCategoryFK,
                    )?.templateTypes || []
                  return (
                    <CodeSelect
                      localFilter={x =>
                        filterTemplateTypes.some(y => x.id === y)
                      }
                      orderBy={[
                        [x => filterTemplateTypes.findIndex(y => y === x.id)],
                        ['asc'],
                      ]}
                      code='LTDocumentTemplateType'
                      label='Document Type'
                      onChange={v => {
                        if (v !== 3) {
                          setFieldValue('isDefaultTemplate', false)
                        }
                      }}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='code'
                render={args => (
                  <TextField
                    label='Code'
                    autoFocus
                    {...args}
                    disabled={!!settingDocumentTemplate.entity}
                  />
                )}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='displayValue'
                render={args => <TextField label='Display Value' {...args} />}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='effectiveDates'
                render={args => {
                  return (
                    <DateRangePicker
                      label='Effective Start Date'
                      label2='End Date'
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem
              md={6}
              style={{
                position: 'relative',
              }}
            >
              {documentTemplateTypeFK === 3 && (
                <FastField
                  name='isDefaultTemplate'
                  render={args => {
                    return (
                      <Checkbox
                        label={
                          <Tooltip title='For auto generate vaccination certificate'>
                            <span>Default Template</span>
                          </Tooltip>
                        }
                        {...args}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                        }}
                      />
                    )
                  }}
                />
              )}
            </GridItem>
            <GridItem md={12}>
              <Field
                name='templateContent'
                render={args => {
                  const cfg = {}
                  if (height && height > 538) {
                    cfg.height = height - 440
                  }
                  return documentCategoryFK === DOCUMENT_CATEGORY.FORM ? (
                    <div style={{ margin: '0 -8px' }}>
                      <div
                        style={{
                          marginLeft: 8,
                          height: '25px',
                          lineHeight: '25px',
                          fontWeight: 'inherit',
                          color: 'rgb(0,0,0,0.54)',
                          transform: 'translate(0,3px) scale(0.8)',
                          transformOrigin: 'top left',
                        }}
                      >
                        Template Message
                      </div>
                      <DocumentEditor
                        documentName={values.displayValue}
                        document={values.templateContent}
                        ref={r => (this.edContainer = r?.container)}
                        contentChange={this.contentChange.bind(this)}
                        documentChange={() => {
                          if (this.edContainer?.documentEditor)
                            this.edContainer.documentEditor.selection.isHighlightEditRegion = true
                        }}
                        created={this.componentCreated.bind(this)}
                        height={'calc( 100vh - 340px)'}
                        toolbarClick={e => {
                          const {
                            item: {
                              properties: { id },
                            },
                          } = e
                          if (id === 'signaturePanel') {
                            const currentUser = 'Everyone'
                            const signaturePlaceholder = ' '
                            const startOffset = this.edContainer.documentEditor
                              .selection.endOffset
                            this.edContainer.documentEditor.editor.insertText(
                              signaturePlaceholder,
                            )
                            const endOffset = this.edContainer.documentEditor
                              .selection.endOffset
                            // console.log(startOffset,endOffset)
                            this.edContainer.documentEditor.selection.select(
                              startOffset,
                              endOffset,
                            )
                            this.edContainer.documentEditor.editor.insertEditingRegion(
                              currentUser,
                            )
                            this.edContainer.documentEditor.selection.select(
                              endOffset,
                              endOffset,
                            )
                          }
                        }}
                        toolbarItems={[
                          'Open',
                          'Separator',
                          'Undo',
                          'Redo',
                          'Separator',
                          'Image',
                          'Table',
                          'Hyperlink',
                          'Separator',
                          'Header',
                          'Footer',
                          'PageSetup',
                          'PageNumber',
                          'Break',
                          'Separator',
                          'Find',
                          'Separator',
                          //'RestrictEditing',
                          'FormFields',
                          {
                            id: 'signaturePanel',
                            text: 'Signature Panel',
                            prefixIcon: 'e-signature',
                          },
                        ]}
                      />
                      <this.FormFieldTips />
                    </div>
                  ) : (
                    <RichEditor
                      label='Template Message'
                      tagList={
                        documentTemplateTypeFK === 3
                          ? tagList.filter(
                              t =>
                                ['Order', 'ExternalPrescription'].indexOf(
                                  t.value,
                                ) < 0,
                            )
                          : tagList
                      }
                      {...cfg}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <CommonModal
            title='Save Template'
            maxWidth='sm'
            open={this.state.isShowSaveDefaultTemplate}
            onClose={this.handelSaveDefaultTemplate}
            onConfirm={() => {
              this.handelSaveDefaultTemplate()
              props.handleSubmit()
            }}
            cancelText='Cancel'
            showFooter
          >
            <div
              style={{
                marginLeft: 20,
                marginRight: 20,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  marginTop: -20,
                }}
              >
                <h3>{`Select ${displayValue || ''} as default template?`}</h3>
              </div>
            </div>
          </CommonModal>
        </div>
        {footer &&
          footer({
            onConfirm: this.handelConfirm,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: false,
            },
          })}
      </SizeContainer>
    )
  }
}

export default withStyles(styles, { name: 'DocumentTemplateDetail' })(Detail)
