/* eslint-env browser */
import React, { Component } from 'react';

/** 設問：説明文 */
export default class DescriptionQuestion extends Component {
  render() {
    const { replacer, question } = this.props;
    const description = question.getDescription();
    return (
      <div className="DescriptionQuestion">
        <p className="description" dangerouslySetInnerHTML={{ __html: replacer.id2Span(description) }} />
        {/*
         page.jsではページ内に一つもinput:visible,select:visible,textarea:visibleなエレメントがないと
         自動でスキップしてしまうため、飛ばされないようにするためのエレメント
          */}
        <input type="text" style={{ position: 'absolute', left: '-10000px' }} />
      </div>
    );
  }
}
