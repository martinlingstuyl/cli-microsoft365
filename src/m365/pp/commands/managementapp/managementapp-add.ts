import { Application } from '@microsoft/microsoft-graph-types';
import { Logger } from '../../../../cli/Logger.js';
import GlobalOptions from '../../../../GlobalOptions.js';
import request from '../../../../request.js';
import { formatting } from '../../../../utils/formatting.js';
import { validation } from '../../../../utils/validation.js';
import PowerPlatformCommand from '../../../base/PowerPlatformCommand.js';
import commands from '../../commands.js';
import { Cli } from '../../../../cli/Cli.js';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  appId?: string;
  objectId?: string;
  name?: string;
}

class PpManagementAppAddCommand extends PowerPlatformCommand {
  public get name(): string {
    return commands.MANAGEMENTAPP_ADD;
  }

  public get description(): string {
    return 'Register management application for Power Platform';
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
    this.#initOptionSets();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        appId: typeof args.options.appId !== 'undefined',
        objectId: typeof args.options.objectId !== 'undefined',
        name: typeof args.options.name !== 'undefined'
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      { option: '--appId [appId]' },
      { option: '--objectId [objectId]' },
      { option: '--name [name]' }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        if (args.options.appId && !validation.isValidGuid(args.options.appId as string)) {
          return `${args.options.appId} is not a valid GUID`;
        }

        if (args.options.objectId && !validation.isValidGuid(args.options.objectId as string)) {
          return `${args.options.objectId} is not a valid GUID`;
        }

        return true;
      }
    );
  }

  #initOptionSets(): void {
    this.optionSets.push({ options: ['appId', 'objectId', 'name'] });
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      const appId = await this.getAppId(args);

      const requestOptions: any = {
        // This should be refactored once we implement a PowerPlatform base class as api.bap will differ between envs.
        url: `${this.resource}/providers/Microsoft.BusinessAppPlatform/adminApplications/${appId}?api-version=2020-06-01`,
        headers: {
          accept: 'application/json;odata.metadata=none'
        },
        responseType: 'json'
      };

      const res = await request.put(requestOptions);
      await logger.log(res);
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }

  private async getAppId(args: CommandArgs): Promise<string> {
    if (args.options.appId) {
      return args.options.appId;
    }

    const { objectId, name } = args.options;

    const filter: string = objectId ?
      `id eq '${formatting.encodeQueryParameter(objectId)}'` :
      `displayName eq '${formatting.encodeQueryParameter(name as string)}'`;

    const requestOptions: any = {
      url: `https://graph.microsoft.com/v1.0/myorganization/applications?$filter=${filter}&$select=appId`,
      headers: {
        accept: 'application/json;odata.metadata=none'
      },
      responseType: 'json'
    };

    const aadApps: { value: Application[] } = await request.get<{ value: Application[] }>((requestOptions));

    if (aadApps.value.length === 0) {
      const applicationIdentifier = objectId ? `ID ${objectId}` : `name ${name}`;
      throw `No Azure AD application registration with ${applicationIdentifier} found`;
    }

    if (aadApps.value.length === 1 && aadApps.value[0].appId) {
      return aadApps.value[0].appId;
    }

    const resultAsKeyValuePair = formatting.convertArrayToHashTable('appId', aadApps.value);
    const result = await Cli.handleMultipleResultsFound<Application>(`Multiple Azure AD application registration with name '${name}' found.`, resultAsKeyValuePair);
    return result.appId!;
  }
}

export default new PpManagementAppAddCommand();
