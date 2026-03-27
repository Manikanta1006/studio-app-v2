function createToothMovements(stepNumber: number) {
  const progress = (stepNumber - 1) / 16

  return Array.from({ length: 32 }, (_, index) => {
    const toothNumber = `${index + 1}`
    const side = index < 16 ? -1 : 1
    const intensity = Math.sin(progress * Math.PI * 0.5)

    return {
      toothNumber,
      rotation: Number((intensity * side * ((index % 4) + 1) * 0.6).toFixed(3)),
      translationX: Number((intensity * side * ((index % 3) + 1) * 0.02).toFixed(3)),
      translationY: Number((intensity * (index < 16 ? 0.01 : -0.01)).toFixed(3)),
      translationZ: Number((intensity * ((index % 2 === 0 ? 1 : -1) * 0.015)).toFixed(3)),
    }
  })
}

export function buildDefaultSteps(caseId: string, versionId: string) {
  return Array.from({ length: 17 }, (_, index) => {
    const stepNumber = index + 1

    return {
      caseId,
      versionId,
      stepNumber,
      name: `Step ${stepNumber}`,
      description:
        stepNumber === 1
          ? 'Initial bite setup'
          : stepNumber === 17
            ? 'Final occlusion and alignment'
            : `Treatment progression - aligner ${stepNumber}`,
      status: stepNumber <= 5 ? 'completed' : 'pending',
      toothMovements: createToothMovements(stepNumber),
    }
  })
}
