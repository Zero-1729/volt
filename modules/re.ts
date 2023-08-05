// Regexes for wallet Descriptors and Extended Keys (XKeys)

// Descriptors
// For now, we only support single key descriptors
// with three specific script types (legacy, P2SH, and Bech32)
//  i.e. ‘wpkh’, ‘pkh’, ‘sh’, ‘sh(wpkh(…))’
// Includes support for optional fingerprint + wallet origin path prefix, (i.e. [abce1234/49h/0h/0h])
// Includes support for optional key path + wildcard suffix (i.e., /0/*)
// Includes support for optional wallet origin path and optional wildcard (i.e., /84'/0'/0'/0/*)
export const nativeWalletDescriptorRegex: RegExp =
    /^((wpkh|pkh)\((\[([a-f0-9]{8})(\/[1-9]{2}(h|'))*(\/([0-9](h|')))*\])*([xyztuv]((pub|prv))[1-9A-HJ-NP-Za-km-z]{79,108})(\/[0-9]{2}(h|'))*(\/([0-9](h|')?))*(\/\*)*\))(#[a-z0-9]{8})?$/;

// Nested descriptors
export const wrappedWalletDescriptorRegex: RegExp =
    /^(sh\(wpkh\((\[([a-f0-9]{8})(\/[1-9]{2}(h|'))*(\/([0-9](h|')))*\])*([xyztuv]((pub|prv))[1-9A-HJ-NP-Za-km-z]{79,108})(\/[0-9]{2}(h|'))*(\/([0-9](h|')?))*(\/\*)*\)\))(#[a-z0-9]{8})?$/;

// Extended Keys
export const extendedKeyPattern: RegExp =
    /^([XxyYzZtuUvV](pub|prv)[1-9A-HJ-NP-Za-km-z]{79,108})$/;
export const descXpubPattern: RegExp =
    /([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})/g;
export const xpubPattern: RegExp =
    /^([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})$/;
export const xprvPattern: RegExp =
    /^([xyztuv]prv[1-9A-HJ-NP-Za-km-z]{79,108})$/;
