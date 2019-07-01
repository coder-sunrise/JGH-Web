import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

// @material-ui/core components
import withStyles from '@material-ui/core/styles/withStyles'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'

import ExpandMore from '@material-ui/icons/ExpandMore'

import accordionStyle from 'mui-pro-jss/material-dashboard-pro-react/components/accordionStyle.jsx'

class Accordion extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      active: props.active,
    }
  }

  handleChange = (panel) => (event, expanded) => {
    this.setState({
      active: expanded ? panel : -1,
    })
  }

  render () {
    const {
      classes,
      collapses,
      expandIcon = <ExpandMore />,
      leftIcon = false,
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
        {collapses.map((prop, key) => {
          return (
            <ExpansionPanel
              expanded={this.state.active === key}
              onChange={this.handleChange(key)}
              key={key}
              classes={{
                root: classes.expansionPanel,
                expanded: classes.expansionPanelExpanded,
              }}
            >
              <ExpansionPanelSummary
                expandIcon={expandIcon}
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
  active: -1,
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

export default withStyles(accordionStyle)(Accordion)
