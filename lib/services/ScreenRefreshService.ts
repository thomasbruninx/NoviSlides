import { bumpScreenRevision } from './ScreenRevisionService';
import { eventHub } from './events';

export class ScreenRefreshService {
  async refreshScreen(screenId: string) {
    const revisionInfo = await bumpScreenRevision(screenId);
    eventHub.publish({
      type: 'screenChanged',
      slideshowId: revisionInfo.slideshowId,
      screenKey: revisionInfo.screenKey,
      revision: revisionInfo.revision,
      at: new Date().toISOString()
    });
    return revisionInfo;
  }
}
