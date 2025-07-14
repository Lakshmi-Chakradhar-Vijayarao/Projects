#include "types.h"
#include "x86.h"
#include "defs.h"
#include "param.h"
#include "mmu.h"
#include "proc.h"
#include "sysfunc.h"

/* This code has been added by akshay and jagan with netid's akj200008 and jxm210003 respectively
** Including the header file to be used for sys_getpinfo method
*/
#include "pstat.h"


// the settickets syscall function
int
sys_settickets(void){

  int num_tickets;          // creating the int variable which takes the argument value

  argint(0, &num_tickets);  // getting the value of the argument for the kernel

  if(num_tickets <= 0)      // checking the sanity of the argument received
    return -1;

  return settickets(num_tickets); //calling the settickets method
}


// the getpinfo syscall function
int
sys_getpinfo(void){

  struct pstat* info;       // creating the pstat struct variable which takes the argument value

  argptr(0, (void*)&info, sizeof(*info));   // getting the value of the argument for the kernel

  if(info == NULL){         // checking the sanity of the argument received
    return -1;
  }

  return getpinfo(info);    //calling the getpinfo method
}

/* End of code added */



int
sys_fork(void)
{
  return fork();
}

int
sys_exit(void)
{
  exit();
  return 0;  // not reached
}

int
sys_wait(void)
{
  return wait();
}

int
sys_kill(void)
{
  int pid;

  if(argint(0, &pid) < 0)
    return -1;
  return kill(pid);
}

int
sys_getpid(void)
{
  return proc->pid;
}

int
sys_sbrk(void)
{
  int addr;
  int n;

  if(argint(0, &n) < 0)
    return -1;
  addr = proc->sz;
  if(growproc(n) < 0)
    return -1;
  return addr;
}

int
sys_sleep(void)
{
  int n;
  uint ticks0;
  
  if(argint(0, &n) < 0)
    return -1;
  acquire(&tickslock);
  ticks0 = ticks;
  while(ticks - ticks0 < n){
    if(proc->killed){
      release(&tickslock);
      return -1;
    }
    sleep(&ticks, &tickslock);
  }
  release(&tickslock);
  return 0;
}

// return how many clock tick interrupts have occurred
// since boot.
int
sys_uptime(void)
{
  uint xticks;
  
  acquire(&tickslock);
  xticks = ticks;
  release(&tickslock);
  return xticks;
}
