import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { trackUi } from '@/common/analytics';
import { SaveSharedTreeDialog } from '@/common/components/share/SaveSharedTreeDialog';
import { ShareDialog } from '@/common/components/share/ShareDialog';
import { SharedTreeNotice } from '@/common/components/share/SharedTreeNotice';
import { useMediaQuery } from '@/common/hooks/use-media-query';
import type { Mode } from '@/common/playground';
import { useSharedSession } from '@/common/share/session-context';
import type { PlaygroundShareAdapter } from '@/common/share/types';
import { useChrome } from '@/app/use-chrome';
import { getPlayground, PLAYGROUNDS } from '@/app/registry';
import { AppShellHeader } from './shell/AppShellHeader';
import { ChromeMenu } from './shell/ChromeMenu';
import { ConfigSheet } from './shell/ConfigSheet';
import { ImmersiveCluster } from './shell/ImmersiveCluster';
import { PlaygroundsSheet } from './shell/PlaygroundsSheet';
import { useHeaderHeight } from './shell/use-header-height';
import { useShareActions } from './shell/use-share-actions';

export interface AppShellShare {
  adapter: PlaygroundShareAdapter;
  state: unknown;
}

export interface AppShellProps {
  playgroundId: string;
  mode: Mode;
  config?: React.ReactNode;
  share?: AppShellShare;
}

// Header global: logo, selector de playground, cambio de modo y configuración.
// En mobile (y en modo inmersivo) todo se concentra en menús.
export function AppShell({ playgroundId, mode, config, share }: AppShellProps) {
  const playground = getPlayground(playgroundId) ?? PLAYGROUNDS[0];
  const { hidden, showHeader, hideHeader } = useChrome();
  const [configOpen, setConfigOpen] = React.useState(false);
  const [playgroundsOpen, setPlaygroundsOpen] = React.useState(false);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const isSmall = useMediaQuery('(max-width: 639px)');
  const routerLocation = useLocation();
  const session = useSharedSession();
  // Un cambio de modo dentro del mismo playground conserva el enlace.
  const modeSearch = session.active ? routerLocation.search : '';
  const canShare = !!share && !share.adapter.isEmpty(mode, share.state);
  const noticeVisible = !!share && session.active && session.status === 'protected';
  const canSave = noticeVisible && !!share;

  const headerRef = useHeaderHeight(hidden);
  const { shareOpen, setShareOpen, shareUrl, launchShare, copyShareLink } = useShareActions({
    playgroundId: playground.id,
    mode,
    share,
    canShare,
  });

  function showHeaderTop() {
    setConfigOpen(false);
    setPlaygroundsOpen(false);
    trackUi('fullscreen', { value: 'off' });
    showHeader();
  }

  function hideHeaderTop() {
    setConfigOpen(false);
    setPlaygroundsOpen(false);
    trackUi('fullscreen', { value: 'on' });
    hideHeader();
  }

  const chromeMenu = (
    <ChromeMenu
      playground={playground}
      mode={mode}
      modeSearch={modeSearch}
      canShare={canShare}
      canSave={canSave}
      onShare={launchShare}
      onCopyLink={copyShareLink}
      onSave={() => setSaveOpen(true)}
      onOpenConfig={() => setConfigOpen(true)}
      onOpenPlaygrounds={() => setPlaygroundsOpen(true)}
    />
  );

  return (
    <>
      <h1 className="sr-only">
        Visualizador de {playground.title.toLowerCase()} en modo {playground.modes[mode].label.toLowerCase()}: practicar y
        visualizar árboles
      </h1>
      {hidden ? (
        !configOpen &&
        !playgroundsOpen && <ImmersiveCluster menu={chromeMenu} onShowHeader={showHeaderTop} />
      ) : (
        <AppShellHeader
          playground={playground}
          mode={mode}
          modeSearch={modeSearch}
          isSmall={isSmall}
          canShare={canShare}
          canSave={canSave}
          config={config}
          headerRef={headerRef}
          menu={chromeMenu}
          onShare={launchShare}
          onSave={() => setSaveOpen(true)}
          onHideHeader={hideHeaderTop}
        />
      )}

      <ConfigSheet
        open={configOpen}
        onOpenChange={setConfigOpen}
        playground={playground}
        hidden={hidden}
        config={config}
        onShowHeader={showHeaderTop}
      />

      <PlaygroundsSheet
        open={playgroundsOpen}
        onOpenChange={setPlaygroundsOpen}
        playground={playground}
        mode={mode}
      />

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} url={shareUrl ?? ''} />

      <SharedTreeNotice
        visible={noticeVisible}
        minimized={session.minimized}
        onMinimize={session.minimize}
        onExpand={session.expand}
        onSave={() => setSaveOpen(true)}
      />

      <SaveSharedTreeDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        autoLabel={playground.modes.auto.label}
        manualLabel={playground.modes.manual.label}
        onConfirm={(target) => {
          if (share) session.save(share.adapter, target);
        }}
      />
    </>
  );
}
