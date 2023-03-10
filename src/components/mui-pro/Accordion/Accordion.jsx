import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import _ from 'lodash'
import color from 'color'
// @material-ui/core components
import withStyles from '@material-ui/core/styles/withStyles'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMore from '@material-ui/icons/ExpandMore'
// styles
import accordionStyle from 'mui-pro-jss/material-dashboard-pro-react/components/accordionStyle.jsx'
import { primaryColor } from 'mui-pro-jss'

const styles = (theme) => ({
  ...accordionStyle(theme),
  expansionPanel: {
    boxShadow: 'none',
    '&:before': {
      display: 'none !important',
    },
    borderColor: '#AAAAAA',
    borderStyle: 'solid',
    borderWidth: 'thin',
    // marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  expansionPanelExpanded: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
})

class Accordion extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      active: Array.isArray(props.defaultActive)
        ? props.defaultActive[0]
        : props.defaultActive,
      activedKeys: Array.isArray(props.defaultActive)
        ? props.defaultActive
        : [
            props.defaultActive,
          ],
    }
  }

  static getDerivedStateFromProps (nextProps, preState) {
    const { active, activedKeys, mode } = nextProps
    const val = {}

    if (
      mode === 'default' &&
      active !== undefined &&
      !_.isEqual(active, preState.active)
    ) {
      val.active = active
    }
    if (
      mode === 'multiple' &&
      activedKeys !== undefined &&
      !_.isEqual(activedKeys, preState.activedKeys)
    ) {
      val.activedKeys = activedKeys
    }
    if (!_.isEmpty(val)) return val
    return null
  }

  handleChange = (p) => (event, expanded) => {
    const { props } = this
    const { onChange, onExpend } = props

    this.setState((prevState) => {
      let keys = prevState.activedKeys
      if (expanded) {
        keys.push(p.key)
      } else {
        keys = keys.filter((o) => o !== p.key)
      }
      if (onExpend) onExpend(keys)
      if (onChange) onChange(event, p, expanded)

      return {
        active: expanded ? p.key : -1,
        activedKeys: keys,
      }
    })
  }

  render () {
    const {
      classes,
      collapses,
      expandIcon = <ExpandMore />,
      leftIcon = false,
      mode = 'default',
    } = this.props
    const extraClass = classnames({
      [classes.reverseRow]: leftIcon,
    })
    const expandIconClass = classnames({
      [classes.expansionPanelSummaryExpandIcon]: true,
      [classes.expandIconAtLeft]: leftIcon,
    })

    return (
      <div className={classes.root}>
        {collapses.map((prop, i) => {
          const key = i
          return (
            <ExpansionPanel
              expanded={
                mode === 'multiple' ? (
                  this.state.activedKeys.indexOf(key) >= 0
                ) : (
                  this.state.active === key
                )
              }
              onChange={this.handleChange({
                key,
                prop,
              })}
              key={key}
              classes={{
                root: classes.expansionPanel,
                expanded: classes.expansionPanelExpanded,
              }}
            >
              <ExpansionPanelSummary
                expandIcon={prop.hideExpendIcon ? null : expandIcon}
                onClick={prop.onClickSummary}
                classes={{
                  root: classes.expansionPanelSummary,
                  expanded: classes.expansionPanelSummaryExpaned,
                  content: classes.expansionPanelSummaryContent,
                  expandIcon: expandIconClass,
                }}
                className={extraClass}
              >
                <h4 className={classes.title}>{prop.title}</h4>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails className={classes.expansionPanelDetails}>
                {prop.content}
              </ExpansionPanelDetails>
            </ExpansionPanel>
          )
        })}
      </div>
    )
  }
}

Accordion.defaultProps = {
  // active: -1,
  // activedKeys: [],
}

Accordion.propTypes = {
  classes: PropTypes.object.isRequired,
  // index of the default active collapse
  active: PropTypes.number,
  collapses: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      content: PropTypes.node,
    }),
  ).isRequired,
}

export default withStyles(styles)(Accordion)
