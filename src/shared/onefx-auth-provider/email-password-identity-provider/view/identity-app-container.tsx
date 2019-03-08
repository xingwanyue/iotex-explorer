import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {IdentityApp} from './identity-app';

export const IdentityAppContainer = withRouter(
  // @ts-ignore
  connect(
    function mapStateToProps(state) {
      return {
        // @ts-ignore
        googleTid: state.base.analytics.googleTid,
        // @ts-ignore
        locale: state.base.locale,
      };
    },
  )(IdentityApp));