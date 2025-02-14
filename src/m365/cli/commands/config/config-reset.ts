import { Cli } from "../../../../cli/Cli.js";
import { Logger } from "../../../../cli/Logger.js";
import GlobalOptions from "../../../../GlobalOptions.js";
import { settingsNames } from "../../../../settingsNames.js";
import AnonymousCommand from "../../../base/AnonymousCommand.js";
import commands from "../../commands.js";

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  key?: string;
}

class CliConfigResetCommand extends AnonymousCommand {
  private static readonly optionNames: string[] = Object.getOwnPropertyNames(settingsNames);

  public get name(): string {
    return commands.CONFIG_RESET;
  }

  public get description(): string {
    return 'Resets the specified CLI configuration option to its default value';
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        key: args.options.key
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-k, --key [key]',
        autocomplete: CliConfigResetCommand.optionNames
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        if (args.options.key) {
          if (CliConfigResetCommand.optionNames.indexOf(args.options.key) < 0) {
            return `${args.options.key} is not a valid setting. Allowed values: ${CliConfigResetCommand.optionNames.join(', ')}`;
          }
        }

        return true;
      }
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    if (args.options.key) {
      Cli.getInstance().config.delete(args.options.key);
    }
    else {
      Cli.getInstance().config.clear();
    }
  }
}

export default new CliConfigResetCommand();
