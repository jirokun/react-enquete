/* eslint-env browser */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import moment from 'moment';
import numbro from 'numbro';
import pikaday from 'pikaday';
import Zeroclipboard from 'zeroclipboard';
import Handsontable from 'handsontable';
import HotTable from 'react-handsontable';
import { animateScroll } from 'react-scroll';
import 'handsontable/dist/handsontable.full.css';
import EnqueteRuntimeApp from '../../runtime/containers/EnqueteRuntimeApp';
import * as Actions from '../../runtime/actions';
import { setDevId, isDevelopment } from '../../utils';

/** プレビューのためのコンテナ */
class EnquetePreviewApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'pc',
      answerOpen: true,
    };
  }

  componentDidMount() {
    const { survey } = this.props;
    if (isDevelopment()) setDevId(this.rootEl, survey);
  }

  /**
   * 遷移先のページの一覧をoptionタグで返す
   */
  createPageOptions() {
    const { survey } = this.props;
    const nodeIds = survey.getAllPageOrFinisherNodeIds();
    return nodeIds.map((nodeId) => {
      const key = `node_id_option_${this.props.index}_${nodeId}`;
      return <option key={key} value={nodeId}>{survey.calcNodeLabel(nodeId)}</option>;
    });
  }

  handleAnswerValueChange(changes, source) {
    const { survey, changeAnswers } = this.props;
    if (source === 'loadData') return;
    const allOutputDefinitions = survey.getAllOutputDefinitions();
    const changedAnswer = {};
    changes.forEach((change) => {
      changedAnswer[allOutputDefinitions.get(change[0]).getName()] = change[3];
    });
    changeAnswers(changedAnswer);
  }

  handleChangeCurrentNodeId(nodeId) {
    const { changeCurrentNodeId } = this.props;
    animateScroll.scrollToTop({
      smooth: true,
      duration: 100,
    });
    changeCurrentNodeId(nodeId);
  }

  changeView(mode) {
    this.setState({ mode });
    this.props.parsleyWrapper.destroy();
  }

  render() {
    const { survey, runtime, restart } = this.props;
    const { mode } = this.state;

    if (mode === 'pc') {
      document.body.className = 'm3-enquete__user-agent-group--PC';
    } else {
      document.body.className = 'm3-enquete__user-agent-group--SP';
    }

    const answers = runtime.getAnswers();
    const hotData = survey.getAllOutputDefinitions().map(od => (
      {
        outputNo: od.getOutputNo(),
        dlLabel: od.getDlLabel(),
        value: answers.get(od.getName()),
        name: od.getName(),
      }
    )).toArray();

    return (
      <div>
        {survey.getCssUrls().toArray().map(url => <link key={url} type="text/css" rel="stylesheet" href={url} />)}
        <div className={classNames('preview-main', { open: this.state.answerOpen })}>
          <div className="formButtons preview">
            <p>[プレビュー モード] 回答は保存されません</p>
            <button onClick={() => restart()}>やり直す</button>
            <button onClick={() => window.close()}>閉じる</button>
            <button className="spMode pc" style={{ marginLeft: '50px' }} onClick={() => this.changeView('pc')}>PC表示</button>
            <button className="spMode sp" onClick={() => this.changeView('sp')}>スマホ表示</button>
          </div>
          <EnqueteRuntimeApp doNotPostAnswers showEditModeMessage showAnswerDownloadLink />
        </div>
        <div className="preview-answer">
          <div className="caption">現在のページ</div>
          <div className="current-page">
            <select value={runtime.getCurrentNodeId()} onChange={e => this.handleChangeCurrentNodeId(e.target.value)}>
              {this.createPageOptions()}
            </select>
          </div>
          <div className="help">
            <p>※現在のページを変更すると指定したページへ直接移動できます</p>
          </div>
          <div className="caption">回答値</div>
          <HotTable
            data={hotData}
            columns={[
              { data: 'outputNo', readOnly: true },
              { data: 'dlLabel', readOnly: true },
              { data: 'value' },
            ]}
            colHeaders={['設問番号', 'CSV出力時のカラム名', '値']}
            colWidths={[80, 450, 200]}
            afterChange={(value, event) => this.handleAnswerValueChange(value, event)}
          />
          <div className="help">
            <p>※回答値は、再掲やページ分岐の条件として利用されます</p>
            <p>※回答値の「値」は直接編集できます</p>
            <p>※回答値をコピーしておき、次回ペーストして再利用することもできます</p>
          </div>
        </div>
      </div>
    );
  }
}

const stateToProps = state => ({
  survey: state.getSurvey(),
  runtime: state.getRuntime(),
  view: state.getViewSetting(),
  options: state.getOptions(),
});

const actionsToProps = dispatch => ({
  restart: () => dispatch(Actions.restart()),
  changeCurrentNodeId: specifiedNodeId => dispatch(Actions.changeCurrentNodeId(specifiedNodeId)),
  changeAnswers: answers => dispatch(Actions.changeAnswers(answers)),
});

export default connect(
  stateToProps,
  actionsToProps,
)(EnquetePreviewApp);
