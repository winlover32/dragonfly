// Autogenerated by hob
window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/** 
  * Frames are in innermost-first order.
  */
cls.EcmascriptDebugger["6.0"].BacktraceFrameList = function(arr)
{
  this.frameList = (arr[0] || []).map(function(item)
  {
    return new cls.EcmascriptDebugger["6.0"].BacktraceFrame(item);
  });
};

cls.EcmascriptDebugger["6.0"].BacktraceFrame = function(arr)
{
  this.functionID = arr[0];
  this.argumentObject = arr[1];
  this.variableObject = arr[2];
  this.thisObject = arr[3];
  /** 
    * TODO: Spec says repeated, while the code only assumes one (optional)
    */
  this.objectValue = arr[4] ? new cls.EcmascriptDebugger["6.0"].ObjectValue(arr[4]) || null;
  this.scriptID = arr[5];
  this.lineNumber = arr[6];
};

cls.EcmascriptDebugger["6.0"].ObjectValue = function(arr)
{
  this.objectID = arr[0];
  this.isCallable = arr[1];
  /** 
    * type, function or object
    */
  this.type = arr[2];
  this.prototypeID = arr[3];
  /** 
    * The class of the object.
    */
  this.className = arr[4];
  /** 
    * If the object is a function, this is the name of
    * the variable associated with that function (if any).
    */
  this.functionName = arr[5];
};

