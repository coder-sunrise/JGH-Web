// import React, { PureComponent } from 'react'
// import Yup from '@/utils/yup'
// import _ from 'lodash'
// import { formatMessage, FormattedMessage } from 'umi'
// import {
//   withFormikExtend,
//   FastField,
//   GridContainer,
//   GridItem,
//   TextField,
//   CodeSelect,
//   DateRangePicker,
// } from '@/components'

// const styles = (theme) => ({})

// @withFormikExtend({
//   mapPropsToValues: ({ settingServiceCenterCategory }) =>
//   settingServiceCenterCategory.entity || settingServiceCenterCategory.default,
//   validationSchema: Yup.object().shape({
//     code: Yup.string().required(),
//     displayValue: Yup.string().required(),
//     serviceCenterCategoryFK: Yup.string().required(),
//     effectiveDates: Yup.array().of(Yup.date()).min(2).required(),
//   }),
//   handleSubmit: (values, { props }) => {
//     const { effectiveDates, ...restValues } = values
//     const { dispatch, onConfirm } = props
//     dispatch({
//       type: 'settingServiceCenterCategory/upsert',
//       payload: {
//         ...restValues,
//         effectiveStartDate: effectiveDates[0],
//         effectiveEndDate: effectiveDates[1],
//         //serviceCenterCategoryFK: 1,
//         serviceCenterCategoryFKNavigation: null
//       },
//     }).then((r) => {
//       if (r) {
//         if (onConfirm) onConfirm()
//         dispatch({
//           type: 'settingServiceCenterCategory/query',
//         })
//       }
//     })
//   },
//   displayName: 'ServiceCenterCategoryDetail',
// })
// class Detail extends PureComponent {
//   state = {}

//   render () {
//     const { props } = this
//     const { classes, theme, footer, values } = props
//     // console.log('detail', props)
//     return (
//       <React.Fragment>
//         <div style={{ margin: theme.spacing(1) }}>
//           <GridContainer>
//             <GridItem md={4}>
//               <FastField
//                 name='code'
//                 render={(args) => (
//                   <TextField label='Code' autoFocused {...args} />
//                 )}
//               />
//             </GridItem>
//             <GridItem md={4}>
//               <FastField
//                 name='displayValue'
//                 render={(args) => <TextField label='Display Value' {...args} />}
//               />
//             </GridItem>
//             <GridItem md={4}>
//               <FastField
//                 name='serviceCenterCategoryFK'
//                 render={(args) => <CodeSelect  label='Service Center Category' code='CTServiceCenterCategory' {...args} />}
//               />
//             </GridItem>
//             <GridItem md={12}>
//               <FastField
//                 name='effectiveDates'
//                 render={(args) => {
//                   return (
//                     <DateRangePicker
//                       label='Effective Start Date'
//                       label2='End Date'
//                       {...args}
//                     />
//                   )
//                 }}
//               />
//             </GridItem>
//             <GridItem md={12}>
//               <FastField
//                 name='description'
//                 render={(args) => {
//                   return (
//                     <TextField
//                       label='Description'
//                       multiline
//                       rowsMax={4}
//                       {...args}
//                     />
//                   )
//                 }}
//               />
//             </GridItem>
//           </GridContainer>
//         </div>
//         {footer &&
//           footer({
//             onConfirm: props.handleSubmit,
//             confirmBtnText: 'Save',
//             confirmProps: {
//               disabled: false,
//             },
//           })}
//       </React.Fragment>
//     )
//   }
// }

// export default Detail
