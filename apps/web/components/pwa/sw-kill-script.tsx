const SW_KILL = `
(function () {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    for (var i = 0; i < regs.length; i++) regs[i].unregister();
  });
  if ("caches" in window) {
    caches.keys().then(function (keys) {
      keys.forEach(function (key) {
        if (key.indexOf("hien-nha") === 0) caches.delete(key);
      });
    });
  }
})();
`;

export function SwKillScript() {
  return <script id="sw-kill" dangerouslySetInnerHTML={{ __html: SW_KILL }} />;
}
