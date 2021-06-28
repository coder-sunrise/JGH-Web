import React from 'react'
import { enableRipple } from '@syncfusion/ej2-base'

enableRipple(true)

export class SampleBase extends React.PureComponent {
  componentDidMount () {
    setTimeout(() => {
      this.rendereComplete()
    })
  }

  rendereComplete () {
  }
}
