import React, { PureComponent } from 'react'
import Yup from '@/utils/yup'
import _ from 'lodash'
import { FormattedMessage } from 'umi/locale'
import {
	withFormikExtend,
	FastField,
	GridContainer,
	GridItem,
	TextField,
	DateRangePicker
} from '@/components'

const styles = (theme) => ({})

@withFormikExtend({
	mapPropsToValues: ({ settingMedicationPrecautions }) =>
	settingMedicationPrecautions.entity || settingMedicationPrecautions.default,
	validationSchema: Yup.object().shape({
		code: Yup.string().required(),
		displayValue: Yup.string().required(),
		effectiveDates: Yup.array().of(Yup.date()).min(2).required(),
	}),
	handleSubmit: (values, { props }) => {
		const { effectiveDates, ...restValues } = values
		const { dispatch, onConfirm } = props
		dispatch({
			type: 'settingMedicationPrecautions/upsert',
			payload: {
				...restValues,
				effectiveStartDate: effectiveDates[0],
				effectiveEndDate: effectiveDates[1]
			}
		}).then((r) => {
			if (r) {
				if (onConfirm) onConfirm()
				dispatch({
					type: 'settingMedicationPrecautions/query'
				})
			}
		})
	},
	displayName: 'MedicationPrecautionsDetail'
})
class Detail extends PureComponent {
	state = {}

	render() {
		const { props } = this
		const { theme, footer, settingMedicationPrecautions } = props
		// console.log('detail', props)
		return (
			<React.Fragment>
				<div style={{ margin: theme.spacing(1) }}>
					<GridContainer>
						<GridItem md={4}>
							<FastField
								name='code'
								render={(args) => (
									<TextField
										label='Code'
										autoFocused
										{...args}
										disabled={settingMedicationPrecautions.entity ? true : false}
									/>
								)}
							/>
						</GridItem>
						<GridItem md={4}>
							<FastField
								name='displayValue'
								render={(args) => <TextField label='Display Value' {...args} />}
							/>
						</GridItem>
						<GridItem md={4}>
							<FastField
								name='sortOrder'
								render={(args) => <TextField label='Sort Order' autoFocused {...args} />}
							/>
						</GridItem>
						<GridItem md={12}>
							<FastField
								name='effectiveDates'
								render={(args) => {
									return <DateRangePicker label='Effective Start Date' label2='End Date' {...args} />
								}}
							/>
						</GridItem>
						<GridItem md={12}>
							<FastField
								name='description'
								render={(args) => {
									return <TextField label='Description' multiline rowsMax={4} {...args} />
								}}
							/>
						</GridItem>
					</GridContainer>
				</div>
				{footer &&
					footer({
						onConfirm: props.handleSubmit,
						confirmBtnText: 'Save',
						confirmProps: {
							disabled: false
						}
					})}
			</React.Fragment>
		)
	}
}

export default Detail
