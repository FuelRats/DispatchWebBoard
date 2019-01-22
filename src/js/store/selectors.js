const activeRescueState = (state) => {
  const activeRescueId = state.flags.activeRescue

  if (activeRescueId && state.rescues[activeRescueId]) {
    return {
      activeRescue: state.rescues[activeRescueId],
    }
  }

  return { activeRescue: null }
}





const rescuesState = ({ rescues }) => ({ rescues })





export {
  activeRescueState,
  rescuesState,
}
