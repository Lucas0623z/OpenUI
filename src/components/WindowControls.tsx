import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MinimizeIcon, MaximizeIcon, RestoreIcon, CloseIcon } from './Icons.js'

/**
 * 自定义窗口控制（frameless）：最小化 / 最大化-还原 / 关闭。
 * 放在 DOM 里（而非系统 overlay），这样设置弹窗等的毛玻璃遮罩能统一覆盖它。
 */
export function WindowControls(): JSX.Element {
  const { t } = useTranslation()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.openui.isWindowMaximized().then(setMaximized)
    return window.openui.onWindowMaximized(setMaximized)
  }, [])

  return (
    <div className="wincontrols">
      <button
        className="wincontrols__btn"
        onClick={() => window.openui.minimizeWindow()}
        title={t('controls.minimize')}
      >
        <MinimizeIcon size={16} />
      </button>
      <button
        className="wincontrols__btn"
        onClick={() => window.openui.maximizeWindow().then(setMaximized)}
        title={maximized ? t('controls.restore') : t('controls.maximize')}
      >
        {maximized ? <RestoreIcon size={15} /> : <MaximizeIcon size={15} />}
      </button>
      <button
        className="wincontrols__btn wincontrols__btn--close"
        onClick={() => window.openui.closeWindow()}
        title={t('controls.close')}
      >
        <CloseIcon size={16} />
      </button>
    </div>
  )
}
