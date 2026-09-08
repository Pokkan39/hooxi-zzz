import React from 'react';

export default class OverlayErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('绳网浮层渲染失败', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="ik-overlay" onClick={this.props.onClose}>
          <div className="ik-overlay__backdrop" aria-hidden="true" />
          <div className="ik-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ik-dialog__outer">
              <div className="ik-dialog__inner" style={{ padding: 24, color: '#fff' }}>
                <p>这条委托暂时打不开。</p>
                <button type="button" onClick={this.props.onClose}>关闭</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
