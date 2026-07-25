import { Mutex } from "@/common/util/Mutex.js";

/**
 * デコレータ／function、メソッドの排他制御
 * "@synchronized"でデコレートされたメソッドを排他制御する
 */
export function synchronized() {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as ((...args: unknown[]) => Promise<unknown>) | undefined;
    const mutex = new Mutex();

    descriptor.value = async function (...args: unknown[]) {
      if (!originalMethod) {
        return;
      }

      // ロック
      await mutex.lock();
      try {
        // メソッドの実行
        return await originalMethod.apply(this, args);
      } finally {
        // アンロック
        mutex.unlock();
      }
    };
  };
}
