import { Mutex } from "@/common/util/Mutex";

/**
 * デコレータ／function、メソッドの排他制御
 * "@synchronized"でデコレートされたメソッドを排他制御する
 */
export function synchronized() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const mutex = new Mutex();

    descriptor.value = async function (...args: any[]) {
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
