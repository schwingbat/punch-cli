// Takes built executables and packages theme for download.

/*

Steps:

- Create folders for each platform with the pattern 'punch-${version}-${os}'
- Copy executable into folder
- Write README into folder
- Zip each folder and place into dist/_zipped

*/

const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')
const mkdirp = require('mkdirp')
const Zip = require('jszip')

const distPath = path.join(__dirname, '..', 'dist')
const changelogPath = path.join(__dirname, '..', 'changelog', `${pkg.version}.md`)
let changelog

const unixReadme = `
Installation Instructions:

1. Copy (or symlink) the punch executable into /usr/local/bin
2. Run 'punch help' in your terminal for a complete list of commands.
`

const windowsReadme = `
Installation Instructions:

???
`

const zipOptions = {
  streamFiles: true,
  compression: "DEFLATE",
  compressionOptions: {
      level: 9
  }
}

if (fs.existsSync(changelogPath)) {
  changelog = fs.readFileSync(changelogPath, 'utf8')
} else {
  console.log(`Warning! Changelog not found for version ${pkg.version}!`)
}

mkdirp(path.join(distPath, '_zipped'), (err) => {

  // Mac

  if (fs.existsSync(path.join(distPath, 'mac'))) {
    console.log('Bundling for Mac...')

    const zip = new Zip()
    const exe = fs.readFileSync(path.join(distPath, 'mac', 'punch'))

    zip.file('punch', exe)
    zip.file('readme.md', unixReadme)
    if (changelog) zip.file('changelog.md', changelog)

    zip.generateNodeStream(zipOptions)
      .pipe(fs.createWriteStream(path.join(distPath, '_zipped', `punch-${pkg.version}-mac.zip`)))
      .on('finish', () => {
        console.log(`Bundled Punch v${pkg.version} for Mac`)
      })
  }

  // Linux

  if (fs.existsSync(path.join(distPath, 'linux'))) {
    console.log('Bundling for Linux...')

    const zip = new Zip()
    const exe = fs.readFileSync(path.join(distPath, 'linux', 'punch'))

    zip.file('punch', exe)
    zip.file('readme.md', unixReadme)
    if (changelog) zip.file('changelog.md', changelog)

    zip.generateNodeStream(zipOptions)
      .pipe(fs.createWriteStream(path.join(distPath, '_zipped', `punch-${pkg.version}-linux.zip`)))
      .on('finish', () => {
        console.log(`Bundled Punch v${pkg.version} for Linux`)
      })
  }

  // Windows

  if (fs.existsSync(path.join(distPath, 'windows'))) {
    console.log('Bundling for Windows...')

    const zip = new Zip()
    const exe = fs.readFileSync(path.join(distPath, 'windows', 'punch.exe'))

    zip.file('punch', exe)
    zip.file('readme.md', windowsReadme)
    if (changelog) zip.file('changelog.md', changelog)

    zip.generateNodeStream(zipOptions)
      .pipe(fs.createWriteStream(path.join(distPath, '_zipped', `punch-${pkg.version}-windows.zip`)))
      .on('finish', () => {
        console.log(`Bundled Punch v${pkg.version} for Windows`)
      })
  }
})