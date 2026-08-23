/**
 * アップロード / メディア API
 * 画像や添付ファイルのアップロード・ストレージ使用量確認・ファイル削除などを行います。
 */
export class UploadsAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 画像などのファイルを Nyaitter サーバーにアップロードします。
   *
   * @param {object} params
   * @param {string|Buffer|Uint8Array|ArrayBuffer|Blob} params.file - ファイルデータ（Base64 文字列、Buffer、Uint8Array、ArrayBuffer、または Blob/File）
   * @param {string} params.fileName - ファイル名（例: 'photo.png'）
   * @param {string} [params.contentType='image/png'] - MIME タイプ
   * @param {number} [params.asUserId] - インポスター代理アップロード時のユーザー ID
   * @returns {Promise<{ id: string, url: string, contentType: string, size: number }>}
   *
   * @example
   * // Base64 文字列でアップロード
   * const res = await client.uploads.upload({
   *   file: base64Data,
   *   fileName: 'avatar.png',
   *   contentType: 'image/png',
   * });
   * console.log('アップロード完了:', res.url, res.id);
   */
  async upload({ file, fileName, contentType = 'image/png', asUserId } = {}) {
    let base64String = '';

    if (typeof file === 'string') {
      // data:image/png;base64,... 形式のプレフィックスを除去
      base64String = file.replace(/^data:[^;]+;base64,/, '').trim();
    } else if (file instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(file))) {
      if (typeof Buffer !== 'undefined') {
        base64String = Buffer.from(file).toString('base64');
      } else {
        let binary = '';
        const bytes = new Uint8Array(file.buffer || file);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64String = btoa(binary);
      }
    } else if (file instanceof ArrayBuffer) {
      const bytes = new Uint8Array(file);
      if (typeof Buffer !== 'undefined') {
        base64String = Buffer.from(bytes).toString('base64');
      } else {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64String = btoa(binary);
      }
    } else if (typeof Blob !== 'undefined' && file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      if (typeof Buffer !== 'undefined') {
        base64String = Buffer.from(bytes).toString('base64');
      } else {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64String = btoa(binary);
      }
      if (!contentType && file.type) {
        contentType = file.type;
      }
    } else {
      throw new Error('サポートされていないファイル形式です。Base64 文字列、Buffer、Uint8Array、または Blob を指定してください。');
    }

    return this._client._post('/uploads', {
      file: base64String,
      fileName,
      contentType,
      as_user_id: asUserId,
    });
  }

  /**
   * 自分のストレージ使用状況とファイル一覧を取得します。
   *
   * @returns {Promise<{ limit_mb: number, limit_bytes: number, used_bytes: number, used_percent: number, files: Array<{ id: string, url: string, size: number, lastModified: string }> }>}
   *
   * @example
   * const storage = await client.uploads.getStorage();
   * console.log(`ストレージ使用量: ${storage.used_percent.toFixed(1)}% (${storage.used_bytes} / ${storage.limit_bytes} bytes)`);
   */
  getStorage() {
    return this._client._get('/uploads/storage');
  }

  /**
   * アップロード済みファイルを削除します。
   *
   * @param {object|string[]} params - 削除するファイル ID リストまたはオプション
   * @param {string[]} [params.fileIds] - ファイル ID 配列（例: `['attachments/12/example.png']`）
   * @param {number} [params.asUserId] - インポスター代理削除時のユーザー ID
   * @returns {Promise<{ success: boolean, deleted_count: number }>}
   */
  delete(params) {
    const fileIds = Array.isArray(params) ? params : params?.fileIds;
    const asUserId = Array.isArray(params) ? undefined : params?.asUserId;
    return this._client._delete('/uploads', {
      fileIds,
      as_user_id: asUserId,
    });
  }

  /**
   * 添付画像ファイルのサムネイル（プレビュー）URL を取得します。
   *
   * @param {string} fileId - ファイル ID（例: `'attachments/12/photo.png'`）
   * @returns {string} プレビュー URL
   */
  getPreviewUrl(fileId) {
    const cleanId = String(fileId || '').trim();
    return `${this._client._baseUrl}/uploads/preview?file_id=${encodeURIComponent(cleanId)}`;
  }
}
