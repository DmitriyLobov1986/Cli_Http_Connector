import Yargs from 'yargs'
let yargs = Yargs(process.argv.slice(2))

/** @type {import('./index').Argv} */
const argv = yargs
  .command('import <path> <name>', 'import data', (y) => {
    y.positional('path', {
      describe: "scenario's path",
      type: 'string',
    })
      .positional('name', {
        describe: 'export name',
        type: 'string',
      })
      .option('query', {
        alias: 'q',
        describe: 'query text | query file path ',
        type: 'string',
      })
      .option('params', {
        alias: 'qParams',
        describe: 'query params',
      })
      .option('base', {
        describe: 'loading base',
        type: 'string',
        default: 'utOlap',
      })
  })
  .version(false)
  .help()
  .parseSync()

export default argv
